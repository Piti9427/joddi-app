import { createClient } from '@supabase/supabase-js';
import type { Transaction } from '../App';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthAccessMode = 'strict' | 'guest_readonly';

const configuredMode = String(import.meta.env.VITE_AUTH_ACCESS_MODE || 'strict').toLowerCase();

export const authAccessMode: AuthAccessMode =
  configuredMode === 'guest_readonly' ? 'guest_readonly' : 'strict';

export const allowGuestReadOnly = authAccessMode === 'guest_readonly';

export const requireEmailVerification =
  String(import.meta.env.VITE_REQUIRE_EMAIL_VERIFICATION ?? 'true').toLowerCase() !== 'false';

export function getAuthRedirectUrl() {
  const configuredRedirect = String(import.meta.env.VITE_AUTH_REDIRECT_URL || '').trim();
  if (configuredRedirect.length > 0) return configuredRedirect;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
}

export type TransactionSyncStatus = 'synced' | 'pending' | 'failed';

export type LocalTransaction = Transaction & {
  localId: string;
  syncStatus: TransactionSyncStatus;
  syncError?: string;
  updatedAt: string;
};

type TransactionPayload = Pick<Transaction, 'id' | 'type' | 'amount' | 'category' | 'note' | 'date' | 'merchant'>;

const DB_NAME = 'joddi-offline-store';
const DB_VERSION = 1;
const TRANSACTION_STORE = 'transactions';

let dbPromise: Promise<IDBDatabase> | null = null;
let syncInFlight: Promise<SyncResult> | null = null;

export type SyncResult = {
  synced: LocalTransaction[];
  failed: LocalTransaction[];
  skipped: boolean;
};

function isIndexedDbAvailable() {
  return typeof indexedDB !== 'undefined';
}

function openOfflineDb(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB is not available in this WebView'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(TRANSACTION_STORE)) {
          const store = db.createObjectStore(TRANSACTION_STORE, { keyPath: 'localId' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open offline database'));
      request.onblocked = () => reject(new Error('Offline database upgrade is blocked by another tab'));
    });
  }

  return dbPromise;
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return openOfflineDb().then(
    (db) =>
      new Promise<T | void>((resolve, reject) => {
        const tx = db.transaction(TRANSACTION_STORE, mode);
        const store = tx.objectStore(TRANSACTION_STORE);
        const request = executor(store);
        let result: T | void;

        if (request) {
          request.onsuccess = () => {
            result = request.result;
          };
          request.onerror = () => reject(request.error ?? new Error('Offline database request failed'));
        }

        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error ?? new Error('Offline database transaction failed'));
        tx.onabort = () => reject(tx.error ?? new Error('Offline database transaction aborted'));
      }),
  );
}

function sortTransactions(transactions: LocalTransaction[]) {
  return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function newClientId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toLocalTransaction(
  transaction: Transaction,
  status: TransactionSyncStatus,
  localId = transaction.localId || transaction.id,
  syncError?: string,
): LocalTransaction {
  return {
    ...transaction,
    localId,
    syncStatus: status,
    syncError,
    updatedAt: new Date().toISOString(),
  };
}

function toSupabasePayload(transaction: LocalTransaction): TransactionPayload {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    note: transaction.note,
    date: transaction.date,
    merchant: transaction.merchant,
  };
}

export function createOptimisticTransaction(transaction: Omit<Transaction, 'id'>): LocalTransaction {
  const id = newClientId();
  return toLocalTransaction({ ...transaction, id }, 'pending', id);
}

export async function getLocalTransactions(): Promise<LocalTransaction[]> {
  const result = await runTransaction<LocalTransaction[]>('readonly', (store) => store.getAll());
  return sortTransactions((result ?? []) as LocalTransaction[]);
}

export async function saveLocalTransaction(transaction: LocalTransaction): Promise<LocalTransaction> {
  await runTransaction('readwrite', (store) => store.put(transaction));
  return transaction;
}

export async function clearLocalTransactions(): Promise<void> {
  await runTransaction('readwrite', (store) => store.clear());
}

export async function replaceSyncedTransactions(remoteTransactions: Transaction[]): Promise<LocalTransaction[]> {
  const existing = await getLocalTransactions();
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const remoteIds = new Set(remoteTransactions.map((item) => item.id));
  const unsynced = existing.filter((item) => item.syncStatus !== 'synced' && !remoteIds.has(item.id));
  const syncedRemote = remoteTransactions.map((item) =>
    toLocalTransaction(item, 'synced', existingById.get(item.id)?.localId ?? item.id),
  );
  const nextTransactions = sortTransactions([...syncedRemote, ...unsynced]);

  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(TRANSACTION_STORE, 'readwrite');
    const store = tx.objectStore(TRANSACTION_STORE);
    store.clear();
    nextTransactions.forEach((item) => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to replace local transaction cache'));
    tx.onabort = () => reject(tx.error ?? new Error('Replacing local transaction cache was aborted'));
  });

  return nextTransactions;
}

export async function syncPendingTransactions(): Promise<SyncResult> {
  if (syncInFlight) return syncInFlight;

  syncInFlight = syncPendingTransactionsInternal().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

async function syncPendingTransactionsInternal(): Promise<SyncResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: [], failed: [], skipped: true };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { synced: [], failed: [], skipped: true };
  }

  const localTransactions = await getLocalTransactions();
  const pendingTransactions = localTransactions.filter((item) => item.syncStatus === 'pending' || item.syncStatus === 'failed');
  const synced: LocalTransaction[] = [];
  const failed: LocalTransaction[] = [];

  for (const transaction of pendingTransactions) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) break;

    const { data, error } = await supabase
      .from('transactions')
      .upsert(toSupabasePayload(transaction), { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      const failedTransaction = toLocalTransaction(transaction, 'failed', transaction.localId, error.message);
      await saveLocalTransaction(failedTransaction);
      failed.push(failedTransaction);
      continue;
    }

    const syncedTransaction = toLocalTransaction(data as Transaction, 'synced', transaction.localId);
    await saveLocalTransaction(syncedTransaction);
    synced.push(syncedTransaction);
  }

  return { synced, failed, skipped: false };
}
