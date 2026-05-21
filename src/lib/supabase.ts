import { createClient } from '@supabase/supabase-js';
import type { Transaction } from '../App';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthAccessMode = 'strict' | 'guest_readonly';
export type SyncStatus = 'synced' | 'pending' | 'failed';
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TransactionType = 'Income' | 'Expense';

// กำหนดโหมดการเข้าถึง (Strict คือต้อง Login, Guest คือดูได้อย่างเดียว)
const configuredMode = String(import.meta.env.VITE_AUTH_ACCESS_MODE || 'strict').toLowerCase();

export const authAccessMode: AuthAccessMode = configuredMode === 'guest_readonly' ? 'guest_readonly' : 'strict';

export const allowGuestReadOnly = authAccessMode === 'guest_readonly';

export const requireEmailVerification =
  String(import.meta.env.VITE_REQUIRE_EMAIL_VERIFICATION ?? 'true').toLowerCase() !== 'false';

export function slugify(str: string) {
  return str.trim().toLowerCase().replaceAll(/\s+/g, '-');
}

export function getAuthRedirectUrl() {
  if (globalThis.location) {
    return globalThis.location.origin;
  }
  const configuredRedirect = String(import.meta.env.VITE_AUTH_REDIRECT_URL || '').trim();
  if (configuredRedirect.length > 0) return configuredRedirect;
  return 'http://localhost:3000';
}

export type LocalTransaction = Transaction & {
  localId: string;
  syncStatus: SyncStatus;
  syncError?: string;
  updatedAt: string;
  createdAt?: string;
  deletedAt?: string;
};

export type LocalCategory = {
  id: string;
  localId: string;
  name: string;
  type: TransactionType;
  iconName: string;
  color: string;
  syncStatus: SyncStatus;
  syncError?: string;
  updatedAt: string;
  deletedAt?: string;
};

export type LocalBudget = {
  id: string;
  localId: string;
  category: string;
  limit: number;
  period: BudgetPeriod;
  icon: string;
  categoryId?: string;
  syncStatus: SyncStatus;
  syncError?: string;
  updatedAt: string;
  deletedAt?: string;
};

export type LocalProfile = {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  syncStatus: SyncStatus;
  syncError?: string;
  updatedAt: string;
};

export type LocalReceiptDraft = {
  id: string;
  localId: string;
  imageDataUrl?: string;
  storagePath?: string | null;
  transactionId?: string | null;
  parsedMerchant?: string;
  parsedAmount?: number | null;
  parsedDate?: string | null;
  ocrText?: string;
  syncStatus: SyncStatus;
  syncError?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

type StoreName = 'transactions' | 'categories' | 'budgets' | 'profile' | 'receipts';

type TransactionPayload = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
  merchant?: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
};

type SyncBucket<T> = {
  synced: T[];
  failed: T[];
};

export type SyncResult = SyncBucket<LocalTransaction> & {
  skipped: boolean;
  categories?: SyncBucket<LocalCategory>;
  budgets?: SyncBucket<LocalBudget>;
  profile?: SyncBucket<LocalProfile>;
  receipts?: SyncBucket<LocalReceiptDraft>;
};

const DB_NAME = 'joddi-offline-store';
const DB_VERSION = 3;
const TRANSACTION_STORE: StoreName = 'transactions';
const CATEGORY_STORE: StoreName = 'categories';
const BUDGET_STORE: StoreName = 'budgets';
const PROFILE_STORE: StoreName = 'profile';
const RECEIPT_STORE: StoreName = 'receipts';
const CATEGORY_CHANGE_EVENT = 'joddi:categories-changed';
const BUDGET_CHANGE_EVENT = 'joddi:budgets-changed';
const TRANSACTION_CHANGE_EVENT = 'joddi:transactions-changed';
const RECEIPT_CHANGE_EVENT = 'joddi:receipts-changed';
const SYNC_STATUS_EVENT = 'joddi:sync-status-changed';

export const DEFAULT_CATEGORIES: LocalCategory[] = [
  buildLocalCategory(
    {
      id: '10000000-0000-4000-8000-000000000001',
      name: 'Coffee',
      type: 'Expense',
      iconName: 'Coffee',
      color: 'text-amber-600 dark:text-amber-400',
    },
    'pending',
  ),
  buildLocalCategory(
    {
      id: '10000000-0000-4000-8000-000000000002',
      name: 'Food',
      type: 'Expense',
      iconName: 'Utensils',
      color: 'text-rose-500 dark:text-rose-400',
    },
    'pending',
  ),
  buildLocalCategory(
    {
      id: '10000000-0000-4000-8000-000000000003',
      name: 'Transport',
      type: 'Expense',
      iconName: 'Car',
      color: 'text-blue-500 dark:text-blue-400',
    },
    'pending',
  ),
  buildLocalCategory(
    {
      id: '10000000-0000-4000-8000-000000000004',
      name: 'Bills',
      type: 'Expense',
      iconName: 'Receipt',
      color: 'text-secondary dark:text-slate-400',
    },
    'pending',
  ),
  buildLocalCategory(
    {
      id: '10000000-0000-4000-8000-000000000005',
      name: 'Shopping',
      type: 'Expense',
      iconName: 'ShoppingBag',
      color: 'text-primary dark:text-primary',
    },
    'pending',
  ),
  buildLocalCategory(
    {
      id: '10000000-0000-4000-8000-000000000006',
      name: 'Health',
      type: 'Expense',
      iconName: 'Shield',
      color: 'text-emerald-500 dark:text-emerald-400',
    },
    'pending',
  ),
  buildLocalCategory(
    {
      id: '10000000-0000-4000-8000-000000000007',
      name: 'Income',
      type: 'Income',
      iconName: 'Banknote',
      color: 'text-primary dark:text-primary',
    },
    'pending',
  ),
  buildLocalCategory(
    {
      id: '10000000-0000-4000-8000-000000000008',
      name: 'Gifts',
      type: 'Income',
      iconName: 'Gift',
      color: 'text-fuchsia-500 dark:text-fuchsia-400',
    },
    'pending',
  ),
  buildLocalCategory(
    {
      id: '10000000-0000-4000-8000-000000000009',
      name: 'Freelance',
      type: 'Income',
      iconName: 'Banknote',
      color: 'text-blue-500 dark:text-blue-400',
    },
    'pending',
  ),
];

const DEFAULT_BUDGETS: LocalBudget[] = [
  buildLocalBudget(
    { id: '20000000-0000-4000-8000-000000000001', category: 'Food', limit: 200, period: 'daily', icon: '🍔' },
    'pending',
  ),
  buildLocalBudget(
    { id: '20000000-0000-4000-8000-000000000002', category: 'Shopping', limit: 3000, period: 'monthly', icon: '🛍️' },
    'pending',
  ),
  buildLocalBudget(
    { id: '20000000-0000-4000-8000-000000000003', category: 'Transport', limit: 1500, period: 'monthly', icon: '🚗' },
    'pending',
  ),
];

let dbPromise: Promise<IDBDatabase> | null = null;
let syncInFlight: Promise<SyncResult> | null = null;

function isIndexedDbAvailable() {
  return typeof globalThis.indexedDB !== 'undefined';
}

function dispatchLocalEvent(name: string) {
  if (typeof globalThis.dispatchEvent !== 'undefined') {
    globalThis.dispatchEvent(new Event(name));
  }
}

function nowIso() {
  return new Date().toISOString();
}

// ฟังก์ชันสร้าง ID ฝั่ง Client เพื่อใช้ในการทำ Optimistic UI (บันทึกลงเครื่องทันทีไม่ต้องรอ Server)
function newClientId() {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  // Fallback สำหรับสภาพแวดล้อมที่ไม่มี randomUUID (ใช้ crypto.getRandomValues แทน Math.random เพื่อความปลอดภัย)
  return '10000000-1000-4000-8000-100000000000'.replaceAll(/[018]/g, (char) => {
    const c = Number.parseInt(char, 10);
    const randomByte = globalThis.crypto.getRandomValues(new Uint8Array(1))[0];
    return (c ^ (randomByte & (15 >> (c / 4)))).toString(16);
  });
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function ensureStore(db: IDBDatabase, storeName: StoreName, indexNames: string[] = []) {
  if (db.objectStoreNames.contains(storeName)) return;
  const store = db.createObjectStore(storeName, { keyPath: 'localId' });
  indexNames.forEach((indexName) => store.createIndex(indexName, indexName, { unique: false }));
}

// เปิดการเชื่อมต่อ IndexedDB สำหรับเก็บข้อมูล Offline
function openOfflineDb(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB is not available in this WebView'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // จัดการ Schema ของ Database เมื่อมีการอัปเกรดเวอร์ชัน
      request.onupgradeneeded = () => {
        const db = request.result;
        ensureStore(db, TRANSACTION_STORE, ['syncStatus', 'date']);
        ensureStore(db, CATEGORY_STORE, ['syncStatus', 'name', 'type']);
        ensureStore(db, BUDGET_STORE, ['syncStatus', 'category']);
        ensureStore(db, PROFILE_STORE, ['syncStatus']);
        ensureStore(db, RECEIPT_STORE, ['syncStatus', 'createdAt']);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open offline database'));
      request.onblocked = () => reject(new Error('Offline database upgrade is blocked by another tab'));
    });
  }

  return dbPromise;
}

function runStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | void> {
  return openOfflineDb().then(
    (db) =>
      new Promise<T | void>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const request = executor(store);
        let result: T | void;

        if (request) {
          request.onsuccess = () => {
            result = request.result;
          };
          request.onerror = () => reject(request.error ?? new Error(`${storeName} request failed`));
        }

        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error ?? new Error(`${storeName} transaction failed`));
        tx.onabort = () => reject(tx.error ?? new Error(`${storeName} transaction aborted`));
      }),
  );
}

async function replaceStore<T>(storeName: StoreName, rows: T[]) {
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    rows.forEach((row) => store.put(row));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error(`Failed to replace ${storeName}`));
    tx.onabort = () => reject(tx.error ?? new Error(`Replacing ${storeName} was aborted`));
  });
}

async function getRawStore<T>(storeName: StoreName): Promise<T[]> {
  const result = await runStore<T[]>(storeName, 'readonly', (store) => store.getAll());
  return (result ?? []) as T[];
}

function sortTransactions(transactions: LocalTransaction[]) {
  return [...transactions].filter((transaction) => !transaction.deletedAt).sort((a, b) => b.date.localeCompare(a.date));
}

function sortCategories(categories: LocalCategory[]) {
  return [...categories]
    .filter((category) => !category.deletedAt)
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

function sortBudgets(budgets: LocalBudget[]) {
  return [...budgets].filter((budget) => !budget.deletedAt).sort((a, b) => a.category.localeCompare(b.category));
}

function sortReceiptDrafts(receipts: LocalReceiptDraft[]) {
  return [...receipts].filter((receipt) => !receipt.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function buildLocalCategory(
  category: Pick<LocalCategory, 'id' | 'name' | 'type' | 'iconName' | 'color'> & Partial<LocalCategory>,
  status: SyncStatus,
): LocalCategory {
  return {
    ...category,
    localId: category.localId ?? category.id,
    syncStatus: status,
    syncError: status === 'failed' ? category.syncError : undefined,
    updatedAt: category.updatedAt ?? nowIso(),
  };
}

function buildLocalBudget(
  budget: Pick<LocalBudget, 'id' | 'category' | 'limit' | 'period' | 'icon'> & Partial<LocalBudget>,
  status: SyncStatus,
): LocalBudget {
  return {
    ...budget,
    localId: budget.localId ?? budget.id,
    syncStatus: status,
    syncError: status === 'failed' ? budget.syncError : undefined,
    updatedAt: budget.updatedAt ?? nowIso(),
  };
}

function toLocalTransaction(
  transaction: Transaction,
  status: SyncStatus,
  localId = transaction.localId || transaction.id,
  syncError?: string,
): LocalTransaction {
  const remote = transaction as Transaction & {
    payment_method?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
  };

  return {
    ...transaction,
    paymentMethod: transaction.paymentMethod ?? remote.payment_method ?? 'cash',
    createdAt: transaction.createdAt ?? remote.created_at,
    updatedAt: transaction.updatedAt ?? remote.updated_at ?? nowIso(),
    deletedAt: transaction.deletedAt ?? remote.deleted_at,
    localId,
    syncStatus: status,
    syncError,
  };
}

function toSupabaseTransactionPayload(transaction: LocalTransaction): TransactionPayload {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    note: transaction.note,
    date: transaction.date,
    merchant: transaction.merchant,
    payment_method: transaction.paymentMethod ?? 'cash',
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt,
    deleted_at: transaction.deletedAt,
  };
}

function toLocalCategory(remote: any, status: SyncStatus): LocalCategory {
  return buildLocalCategory(
    {
      id: remote.id,
      localId: remote.localId ?? remote.id,
      name: remote.name,
      type: remote.type,
      iconName: remote.iconName ?? remote.icon ?? 'Receipt',
      color: remote.color ?? 'text-primary dark:text-primary',
      updatedAt: remote.updatedAt ?? remote.updated_at ?? remote.created_at ?? nowIso(),
      deletedAt: remote.deletedAt ?? remote.deleted_at,
    },
    status,
  );
}

function toSupabaseCategoryPayload(category: LocalCategory) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.iconName,
  };
}

function toLocalBudget(remote: any, status: SyncStatus): LocalBudget {
  return buildLocalBudget(
    {
      id: remote.id,
      localId: remote.localId ?? remote.id,
      category: remote.category ?? remote.category_name ?? 'General',
      limit: Number(remote.limit ?? remote.amount_limit ?? 0),
      period: remote.period ?? 'monthly',
      icon: remote.icon ?? '🏷️',
      categoryId: remote.categoryId ?? remote.category_id,
      updatedAt: remote.updatedAt ?? remote.updated_at ?? remote.created_at ?? nowIso(),
      deletedAt: remote.deletedAt ?? remote.deleted_at,
    },
    status,
  );
}

function toSupabaseBudgetPayload(budget: LocalBudget) {
  return {
    id: budget.id,
    category_id: budget.categoryId,
    category: budget.category,
    amount_limit: budget.limit,
    period: budget.period,
    icon: budget.icon,
    month_year: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  };
}

function migrateLegacyCategories(): LocalCategory[] {
  try {
    const raw = localStorage.getItem('user_categories');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) =>
      buildLocalCategory(
        {
          id: isUuid(item.id) ? item.id : newClientId(),
          name: item.name,
          type: item.type,
          iconName: item.iconName ?? item.icon ?? 'Receipt',
          color: item.color ?? 'text-primary dark:text-primary',
        },
        'pending',
      ),
    );
  } catch {
    return [];
  }
}

function migrateLegacyBudgets(): LocalBudget[] {
  try {
    const raw = localStorage.getItem('joddi_budgets');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) =>
      buildLocalBudget(
        {
          id: isUuid(item.id) ? item.id : newClientId(),
          category: item.category,
          limit: Number(item.limit),
          period: item.period ?? 'monthly',
          icon: item.icon ?? '🏷️',
        },
        'pending',
      ),
    );
  } catch {
    return [];
  }
}

// สร้าง Transaction ใหม่ในสถานะ 'pending' เพื่อแสดงผลทันทีแบบ Optimistic UI
export function createOptimisticTransaction(transaction: Omit<Transaction, 'id'>): LocalTransaction {
  const id = newClientId();
  const timestamp = nowIso();
  return toLocalTransaction(
    {
      ...transaction,
      id,
      paymentMethod: transaction.paymentMethod ?? 'cash',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    'pending',
    id,
  );
}

export function createLocalCategory(
  input: Omit<LocalCategory, 'id' | 'localId' | 'syncStatus' | 'updatedAt'>,
): LocalCategory {
  const id = newClientId();
  return buildLocalCategory({ ...input, id }, 'pending');
}

export function createLocalBudget(
  input: Omit<LocalBudget, 'id' | 'localId' | 'syncStatus' | 'updatedAt'>,
): LocalBudget {
  const id = newClientId();
  return buildLocalBudget({ ...input, id }, 'pending');
}

export function createLocalReceiptDraft(input: Partial<LocalReceiptDraft> = {}): LocalReceiptDraft {
  const id = newClientId();
  const timestamp = nowIso();
  return {
    id,
    localId: id,
    imageDataUrl: input.imageDataUrl,
    storagePath: input.storagePath ?? null,
    transactionId: input.transactionId ?? null,
    parsedMerchant: input.parsedMerchant,
    parsedAmount: input.parsedAmount ?? null,
    parsedDate: input.parsedDate ?? null,
    ocrText: input.ocrText,
    syncStatus: 'pending',
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export async function getLocalTransactions(): Promise<LocalTransaction[]> {
  return sortTransactions(await getRawStore<LocalTransaction>(TRANSACTION_STORE));
}

export async function saveLocalTransaction(
  transaction: Omit<LocalTransaction, 'updatedAt'> & { updatedAt?: string },
): Promise<LocalTransaction> {
  const updatedTx = { ...transaction, updatedAt: nowIso() } as LocalTransaction;
  await runStore(TRANSACTION_STORE, 'readwrite', (store) => store.put(updatedTx));
  dispatchLocalEvent(TRANSACTION_CHANGE_EVENT);
  return updatedTx;
}

export async function deleteLocalTransaction(id: string) {
  const transactions = await getRawStore<LocalTransaction>(TRANSACTION_STORE);
  const transaction = transactions.find((t) => t.id === id || t.localId === id);
  if (transaction) {
    await saveLocalTransaction({
      ...transaction,
      deletedAt: nowIso(),
      syncStatus: 'pending' as const,
    });
  }
}

export async function getLocalCategories(): Promise<LocalCategory[]> {
  const result = await getRawStore<LocalCategory>(CATEGORY_STORE);
  if (result && result.length > 0) return sortCategories(result);

  const migrated = migrateLegacyCategories();
  const initial = migrated.length > 0 ? migrated : DEFAULT_CATEGORIES;
  await replaceStore(CATEGORY_STORE, initial);
  dispatchLocalEvent(CATEGORY_CHANGE_EVENT);
  return sortCategories(initial);
}

export async function saveLocalCategories(categories: LocalCategory[]) {
  await replaceStore(
    CATEGORY_STORE,
    categories.map((category) => ({ ...category, updatedAt: nowIso() })),
  );
  dispatchLocalEvent(CATEGORY_CHANGE_EVENT);
}

export async function deleteLocalCategory(id: string) {
  const categories = await getLocalCategories();
  const next = categories.map((category) =>
    category.id === id ? { ...category, deletedAt: nowIso(), syncStatus: 'pending' as const } : category,
  );
  await saveLocalCategories(next);
}

export async function getLocalBudgets(): Promise<LocalBudget[]> {
  const result = await getRawStore<LocalBudget>(BUDGET_STORE);
  if (result && result.length > 0) return sortBudgets(result);

  const migrated = migrateLegacyBudgets();
  const initial = migrated.length > 0 ? migrated : DEFAULT_BUDGETS;
  await replaceStore(BUDGET_STORE, initial);
  dispatchLocalEvent(BUDGET_CHANGE_EVENT);
  return sortBudgets(initial);
}

export async function saveLocalBudgets(budgets: LocalBudget[]) {
  await replaceStore(
    BUDGET_STORE,
    budgets.map((budget) => ({ ...budget, updatedAt: nowIso() })),
  );
  dispatchLocalEvent(BUDGET_CHANGE_EVENT);
}

export async function deleteLocalBudget(id: string) {
  const budgets = await getLocalBudgets();
  const next = budgets.map((budget) =>
    budget.id === id ? { ...budget, deletedAt: nowIso(), syncStatus: 'pending' as const } : budget,
  );
  await saveLocalBudgets(next);
}

export async function getLocalProfile(): Promise<LocalProfile | null> {
  const result = (await runStore<LocalProfile[]>(PROFILE_STORE, 'readonly', (store) => store.getAll())) as
    | LocalProfile[]
    | undefined;
  return result?.[0] ?? null;
}

export async function saveLocalProfile(profile: LocalProfile) {
  await replaceStore(PROFILE_STORE, [{ ...profile, updatedAt: nowIso() }]);
}

export async function getLocalReceiptDrafts(): Promise<LocalReceiptDraft[]> {
  return sortReceiptDrafts(await getRawStore<LocalReceiptDraft>(RECEIPT_STORE));
}

export async function saveLocalReceiptDraft(receipt: LocalReceiptDraft): Promise<LocalReceiptDraft> {
  const next = { ...receipt, updatedAt: nowIso() };
  await runStore(RECEIPT_STORE, 'readwrite', (store) => store.put(next));
  dispatchLocalEvent(RECEIPT_CHANGE_EVENT);
  return next;
}

export async function clearOfflineData(): Promise<void> {
  await Promise.all([
    replaceStore(TRANSACTION_STORE, []),
    replaceStore(CATEGORY_STORE, []),
    replaceStore(BUDGET_STORE, []),
    replaceStore(PROFILE_STORE, []),
    replaceStore(RECEIPT_STORE, []),
  ]);
  dispatchLocalEvent(CATEGORY_CHANGE_EVENT);
  dispatchLocalEvent(BUDGET_CHANGE_EVENT);
  dispatchLocalEvent(RECEIPT_CHANGE_EVENT);
}

export async function clearLocalTransactions(): Promise<void> {
  await clearOfflineData();
}

export async function replaceSyncedTransactions(remoteTransactions: Transaction[]): Promise<LocalTransaction[]> {
  const existing = await getRawStore<LocalTransaction>(TRANSACTION_STORE);
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const remoteIds = new Set(remoteTransactions.map((item) => item.id));
  const unsynced = existing.filter((item) => item.syncStatus !== 'synced' && !remoteIds.has(item.id));
  const syncedRemote = remoteTransactions.map((item) =>
    toLocalTransaction(item, 'synced', existingById.get(item.id)?.localId ?? item.id),
  );
  const nextTransactions = [...syncedRemote, ...unsynced];
  await replaceStore(TRANSACTION_STORE, nextTransactions);
  return sortTransactions(nextTransactions);
}

async function replaceSyncedCategories(remoteCategories: any[]): Promise<LocalCategory[]> {
  const existing = await getRawStore<LocalCategory>(CATEGORY_STORE);
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const remoteIds = new Set(remoteCategories.map((item) => item.id));
  const unsynced = existing.filter((item) => item.syncStatus !== 'synced' && !remoteIds.has(item.id));
  const syncedRemote = remoteCategories.map((item) =>
    toLocalCategory({ ...item, localId: existingById.get(item.id)?.localId }, 'synced'),
  );
  const next = [...syncedRemote, ...unsynced];
  await replaceStore(CATEGORY_STORE, next);
  dispatchLocalEvent(CATEGORY_CHANGE_EVENT);
  return sortCategories(next);
}

async function replaceSyncedBudgets(remoteBudgets: any[]): Promise<LocalBudget[]> {
  const existing = await getRawStore<LocalBudget>(BUDGET_STORE);
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const remoteIds = new Set(remoteBudgets.map((item) => item.id));
  const unsynced = existing.filter((item) => item.syncStatus !== 'synced' && !remoteIds.has(item.id));
  const syncedRemote = remoteBudgets.map((item) =>
    toLocalBudget({ ...item, localId: existingById.get(item.id)?.localId }, 'synced'),
  );
  const next = [...syncedRemote, ...unsynced];
  await replaceStore(BUDGET_STORE, next);
  dispatchLocalEvent(BUDGET_CHANGE_EVENT);
  return sortBudgets(next);
}

export async function syncPendingTransactions(): Promise<SyncResult> {
  if (syncInFlight !== null) return syncInFlight;

  syncInFlight = syncPendingDataInternal().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

export async function syncAllOfflineData(): Promise<SyncResult> {
  return syncPendingTransactions();
}

// ฟังก์ชันหลักในการ Sync ข้อมูลทั้งหมดที่ค้างอยู่ในเครื่องขึ้น Supabase
async function syncPendingDataInternal(): Promise<SyncResult> {
  // ตรวจสอบว่าออนไลน์อยู่หรือไม่
  if (globalThis.navigator !== undefined && !globalThis.navigator.onLine) {
    return { synced: [], failed: [], skipped: true };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // ต้องมี Session ก่อนถึงจะ Sync ได้
  if (!session) {
    return { synced: [], failed: [], skipped: true };
  }

  // ลำดับการ Sync: หมวดหมู่ -> งบประมาณ -> รายการธุรกรรม -> โปรไฟล์ -> สลิป
  const categories = await syncCategories();
  const budgets = await syncBudgets();
  const transactions = await syncTransactions();
  const profile = await syncProfile();
  const receipts = await syncReceipts();

  // ดึงข้อมูลล่าสุดจาก Server มาทับเพื่อความถูกต้อง
  await refreshRemoteSnapshots();

  return {
    ...transactions,
    skipped: false,
    categories,
    budgets,
    profile,
    receipts,
  };
}

async function syncTransactions(): Promise<SyncBucket<LocalTransaction>> {
  const localTransactions = await getRawStore<LocalTransaction>(TRANSACTION_STORE);
  const pendingTransactions = localTransactions.filter(
    (item) => item.syncStatus === 'pending' || item.syncStatus === 'failed',
  );
  const synced: LocalTransaction[] = [];
  const failed: LocalTransaction[] = [];

  for (const transaction of pendingTransactions) {
    if (globalThis.navigator !== undefined && !globalThis.navigator.onLine) break;

    const { data, error } = transaction.deletedAt
      ? await supabase.from('transactions').delete().eq('id', transaction.id).select().maybeSingle()
      : await supabase
          .from('transactions')
          .upsert(toSupabaseTransactionPayload(transaction), { onConflict: 'id' })
          .select()
          .single();

    if (error) {
      const failedTransaction = toLocalTransaction(transaction, 'failed', transaction.localId, error.message);
      await saveLocalTransaction(failedTransaction);
      failed.push(failedTransaction);
      continue;
    }

    if (transaction.deletedAt) {
      await runStore(TRANSACTION_STORE, 'readwrite', (store) => store.delete(transaction.localId));
      continue;
    }

    const syncedTransaction = toLocalTransaction(data as Transaction, 'synced', transaction.localId);
    await saveLocalTransaction(syncedTransaction);
    synced.push(syncedTransaction);
  }

  return { synced, failed };
}

async function syncCategories(): Promise<SyncBucket<LocalCategory>> {
  const localCategories = await getRawStore<LocalCategory>(CATEGORY_STORE);
  const pending = localCategories.filter(
    (item) => item.syncStatus === 'pending' || item.syncStatus === 'failed' || item.deletedAt,
  );
  const synced: LocalCategory[] = [];
  const failed: LocalCategory[] = [];

  for (const category of pending) {
    const { data, error } = category.deletedAt
      ? await supabase.from('categories').delete().eq('id', category.id).select().maybeSingle()
      : await supabase
          .from('categories')
          .upsert(toSupabaseCategoryPayload(category), { onConflict: 'name,type' })
          .select()
          .single();

    if (error) {
      const failedCategory = buildLocalCategory({ ...category, syncError: error.message }, 'failed');
      await runStore(CATEGORY_STORE, 'readwrite', (store) => store.put(failedCategory));
      failed.push(failedCategory);
      continue;
    }

    if (category.deletedAt) {
      await runStore(CATEGORY_STORE, 'readwrite', (store) => store.delete(category.localId));
    } else {
      synced.push(toLocalCategory(data, 'synced'));
    }
  }

  return { synced, failed };
}

async function syncBudgets(): Promise<SyncBucket<LocalBudget>> {
  const localBudgets = await getRawStore<LocalBudget>(BUDGET_STORE);
  const pending = localBudgets.filter(
    (item) => item.syncStatus === 'pending' || item.syncStatus === 'failed' || item.deletedAt,
  );
  const synced: LocalBudget[] = [];
  const failed: LocalBudget[] = [];

  for (const budget of pending) {
    const { data, error } = budget.deletedAt
      ? await supabase.from('budgets').delete().eq('id', budget.id).select().maybeSingle()
      : await supabase.from('budgets').upsert(toSupabaseBudgetPayload(budget), { onConflict: 'id' }).select().single();

    if (error) {
      const failedBudget = buildLocalBudget({ ...budget, syncError: error.message }, 'failed');
      await runStore(BUDGET_STORE, 'readwrite', (store) => store.put(failedBudget));
      failed.push(failedBudget);
      continue;
    }

    if (budget.deletedAt) {
      await runStore(BUDGET_STORE, 'readwrite', (store) => store.delete(budget.localId));
    } else {
      synced.push(toLocalBudget(data, 'synced'));
    }
  }

  return { synced, failed };
}

async function syncProfile(): Promise<SyncBucket<LocalProfile>> {
  const profile = await getLocalProfile();
  if (!profile || profile.syncStatus === 'synced') return { synced: [], failed: [] };

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: profile.id,
        email: profile.email,
        display_name: profile.displayName,
        avatar_url: profile.avatarUrl,
      },
      { onConflict: 'id' },
    )
    .select()
    .single();

  if (error) {
    const failedProfile = { ...profile, syncStatus: 'failed' as const, syncError: error.message, updatedAt: nowIso() };
    await saveLocalProfile(failedProfile);
    return { synced: [], failed: [failedProfile] };
  }

  const syncedProfile: LocalProfile = {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    syncStatus: 'synced',
    updatedAt: data.created_at ?? nowIso(),
  };
  await saveLocalProfile(syncedProfile);
  return { synced: [syncedProfile], failed: [] };
}

async function syncIndividualReceipt(receipt: LocalReceiptDraft) {
  if (receipt.deletedAt) {
    const { error } = await supabase.from('receipts').delete().eq('id', receipt.id);
    if (error) {
      const failedReceipt = {
        ...receipt,
        syncStatus: 'failed' as const,
        syncError: error.message,
        updatedAt: nowIso(),
      };
      await saveLocalReceiptDraft(failedReceipt);
      return { status: 'failed', receipt: failedReceipt };
    }
    await runStore(RECEIPT_STORE, 'readwrite', (store) => store.delete(receipt.localId));
    return { status: 'deleted' };
  }

  let storagePath = receipt.storagePath ?? null;
  if (!storagePath && receipt.imageDataUrl) {
    storagePath = await uploadReceiptImage(receipt.imageDataUrl);
  }

  const { data, error } = await supabase
    .from('receipts')
    .upsert(
      {
        id: receipt.id,
        transaction_id: receipt.transactionId,
        storage_path: storagePath,
        ocr_text: receipt.ocrText,
        parsed_merchant: receipt.parsedMerchant,
        parsed_amount: receipt.parsedAmount,
        parsed_date: receipt.parsedDate,
        created_at: receipt.createdAt,
      },
      { onConflict: 'id' },
    )
    .select()
    .single();

  if (error) {
    const failedReceipt = {
      ...receipt,
      syncStatus: 'failed' as const,
      syncError: error.message,
      updatedAt: nowIso(),
    };
    await saveLocalReceiptDraft(failedReceipt);
    return { status: 'failed', receipt: failedReceipt };
  }

  const syncedReceipt: LocalReceiptDraft = {
    id: data.id,
    localId: receipt.localId,
    imageDataUrl: undefined,
    storagePath: data.storage_path ?? storagePath,
    transactionId: data.transaction_id,
    parsedMerchant: data.parsed_merchant,
    parsedAmount: data.parsed_amount == null ? null : Number(data.parsed_amount),
    parsedDate: data.parsed_date,
    ocrText: data.ocr_text,
    syncStatus: 'synced',
    createdAt: data.created_at ?? receipt.createdAt,
    updatedAt: nowIso(),
  };
  await saveLocalReceiptDraft(syncedReceipt);
  return { status: 'synced', receipt: syncedReceipt };
}

async function syncReceipts(): Promise<SyncBucket<LocalReceiptDraft>> {
  const localReceipts = await getRawStore<LocalReceiptDraft>(RECEIPT_STORE);
  const pending = localReceipts.filter(
    (item) => item.syncStatus === 'pending' || item.syncStatus === 'failed' || item.deletedAt,
  );
  const synced: LocalReceiptDraft[] = [];
  const failed: LocalReceiptDraft[] = [];

  for (const receipt of pending) {
    if (globalThis.navigator !== undefined && !globalThis.navigator.onLine) break;

    const result = await syncIndividualReceipt(receipt);
    if (result.status === 'synced') synced.push(result.receipt);
    else if (result.status === 'failed') failed.push(result.receipt);
  }

  return { synced, failed };
}

async function refreshRemoteSnapshots() {
  const [remoteCategories, remoteBudgets] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('budgets').select('*').order('created_at', { ascending: false }),
  ]);

  if (!remoteCategories.error) await replaceSyncedCategories(remoteCategories.data ?? []);
  if (!remoteBudgets.error) await replaceSyncedBudgets(remoteBudgets.data ?? []);
}

export async function fetchRemoteTransactionsIntoLocal(): Promise<LocalTransaction[]> {
  const syncResult = await syncPendingTransactions();
  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });

  if (error) throw error;
  const merged = await replaceSyncedTransactions((data ?? []) as Transaction[]);
  if (syncResult.failed.length > 0) {
    console.warn('Some transactions failed to sync', syncResult.failed);
  }
  return merged;
}

export async function getSyncSummary() {
  const [transactions, categories, budgets, receipts] = await Promise.all([
    getLocalTransactions(),
    getLocalCategories(),
    getLocalBudgets(),
    getLocalReceiptDrafts(),
  ]);

  const countPending = (rows: { syncStatus: SyncStatus }[]) =>
    rows.filter((row) => row.syncStatus === 'pending' || row.syncStatus === 'failed').length;

  return {
    pendingTransactions: countPending(transactions),
    pendingCategories: countPending(categories),
    pendingBudgets: countPending(budgets),
    pendingReceipts: countPending(receipts),
  };
}

export async function uploadReceiptImage(dataUrl: string): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = blob.type.includes('png') ? 'png' : 'jpg';
  const path = `${session.user.id}/${newClientId()}.${extension}`;
  const { error } = await supabase.storage.from('receipts').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  });

  if (error) {
    console.warn('Receipt image upload failed:', error.message);
    return null;
  }

  return path;
}
