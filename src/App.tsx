import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Session } from '@supabase/supabase-js';
import {
  allowGuestReadOnly,
  clearLocalTransactions,
  createOptimisticTransaction,
  fetchRemoteTransactionsIntoLocal,
  getLocalTransactions,
  getLocalCategories,
  saveLocalTransaction,
  supabase,
  syncPendingTransactions,
  type SyncStatus,
  type LocalCategory,
} from './lib/supabase';
import { TransactionDetail } from './components/TransactionDetail';

export type ViewState =
  | 'onboarding'
  | 'dashboard'
  | 'review_receipt'
  | 'add_transaction'
  | 'transactions'
  | 'analytics'
  | 'budget'
  | 'categories'
  | 'transaction_detail'
  | 'settings';
export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
  merchant?: string;
  paymentMethod?: string;
  localId?: string;
  syncStatus?: SyncStatus;
  syncError?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

const LOCAL_WRITE_BLOCKED_MESSAGE = 'ยังไม่พร้อมบันทึกข้อมูลในเครื่อง กรุณาลองใหม่อีกครั้ง';

function buildDemoTransactions(): Transaction[] {
  const now = Date.now();
  return [
    {
      id: 'demo-1',
      type: 'Income',
      amount: 35000,
      category: 'Salary',
      merchant: 'Demo Company',
      note: 'Demo data',
      date: new Date(now - 86400000 * 2).toISOString(),
      syncStatus: 'synced',
    },
    {
      id: 'demo-2',
      type: 'Expense',
      amount: 145.5,
      category: 'Food',
      merchant: 'Cafe',
      note: 'Demo data',
      date: new Date(now - 86400000).toISOString(),
      syncStatus: 'synced',
    },
    {
      id: 'demo-3',
      type: 'Expense',
      amount: 89,
      category: 'Transport',
      merchant: 'BTS',
      note: 'Demo data',
      date: new Date(now).toISOString(),
      syncStatus: 'synced',
    },
  ];
}

function lazyNamed<T extends React.ComponentType<any>, K extends string>(
  loader: () => Promise<Record<K, T>>,
  exportName: K,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const module = await loader();
    return { default: module[exportName] };
  });
}

const Onboarding = lazyNamed(() => import('./components/Onboarding'), 'Onboarding');
const Dashboard = lazyNamed(() => import('./components/Dashboard'), 'Dashboard');
const ReviewReceipt = lazyNamed(() => import('./components/ReviewReceipt'), 'ReviewReceipt');
const AddTransaction = lazyNamed(() => import('./components/AddTransaction'), 'AddTransaction');
const TransactionHistory = lazyNamed(() => import('./components/TransactionHistory'), 'TransactionHistory');
const AnalyticsDashboard = lazyNamed(() => import('./components/AnalyticsDashboard'), 'AnalyticsDashboard');
const BudgetScreen = lazyNamed(() => import('./components/BudgetScreen'), 'BudgetScreen');
const CategoriesManagement = lazyNamed(() => import('./components/CategoriesManagement'), 'CategoriesManagement');
const Settings = lazyNamed(() => import('./components/Settings'), 'Settings');
const BottomNav = lazyNamed(() => import('./components/BottomNav'), 'BottomNav');
const AuthScreen = lazy(() => import('./components/AuthScreen'));

function ScreenFallback() {
  return (
    <div className="min-h-full bg-background-light dark:bg-background-dark flex items-center justify-center">
      <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('onboarding');
  const [baseView, setBaseView] = useState<ViewState>('dashboard');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const accessMessageTimeout = useRef<number | null>(null);

  const [lang, setLang] = useState<'th' | 'en'>(() => (localStorage.getItem('language') as 'th' | 'en') || 'th');
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'THB');

  const isAuthenticated = Boolean(session);
  const canWrite = isAuthenticated || isGuestMode;

  useEffect(() => {
    return () => {
      if (accessMessageTimeout.current) {
        globalThis.clearTimeout(accessMessageTimeout.current);
      }
    };
  }, []);

  const showAccessMessage = (message: string) => {
    setAccessMessage(message);
    if (accessMessageTimeout.current) {
      globalThis.clearTimeout(accessMessageTimeout.current);
    }
    accessMessageTimeout.current = globalThis.setTimeout(() => setAccessMessage(''), 3000);
  };

  // ฟังก์ชันสำหรับตรวจสอบสถานะการเข้าสู่ระบบและเตรียมข้อมูลเบื้องต้น
  const initAuth = async () => {
    console.log('JoddiApp: Initializing auth and local data...');

    // โหลดข้อมูลจาก Cache ในเครื่องก่อนเพื่อให้แอปเปิดได้ไว (Offline-first)
    getLocalTransactions()
      .then((local) => {
        if (local.length > 0) {
          console.log('JoddiApp: Local transactions loaded:', local.length);
          setTransactions(local);
        }
      })
      .catch((err) => console.error('JoddiApp: Offline cache read error:', err));

    try {
      console.log('JoddiApp: Getting Supabase session (with 5s timeout)...');

      // ตั้ง Timeout ไว้ 5 วินาที เผื่อกรณีอินเทอร์เน็ตช้า จะได้ไม่ค้างหน้า Loading นานเกินไป
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null } }>((_, reject) =>
        globalThis.setTimeout(() => reject(new Error('Session timeout')), 5000),
      );

      const result = (await Promise.race([sessionPromise, timeoutPromise])) as any;
      const existingSession = result?.data?.session || null;

      console.log('JoddiApp: Session check complete. Authenticated:', !!existingSession);

      setSession(existingSession);
      setSessionChecked(true);

      if (existingSession) {
        setIsGuestMode(false);
        setCurrentView('dashboard');
        setBaseView('dashboard');
        fetchTransactions(); // ดึงข้อมูลล่าสุดจาก Server เมื่อเข้าสู่ระบบแล้ว
      } else {
        setIsGuestMode(false);
        setCurrentView('onboarding');
        setBaseView('dashboard');
        setLoading(false);
      }
    } catch (err) {
      console.error('JoddiApp: Session check failed or timed out:', err);
      setSession(null);
      setSessionChecked(true);
      setCurrentView('onboarding');
      setLoading(false);
    }
  };

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // จัดการเรื่อง Theme (Light/Dark mode)
    document.documentElement.classList.remove('dark');

    if (localStorage.getItem('theme_v2_migrated') !== 'true') {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('theme_v2_migrated', 'true');
    } else if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // ฟังเหตุการณ์การเปลี่ยนสถานะการเข้าสู่ระบบ (เช่น Login สำเร็จ)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      console.log('JoddiApp: Auth state changed. Session exists:', !!nextSession);
      setSession(nextSession);
      setSessionChecked(true);

      if (nextSession) {
        setIsGuestMode(false);
        setCurrentView('dashboard');
        setBaseView('dashboard');
        fetchTransactions();
      }
    });

    initAuth();

    const fetchCategories = async () => {
      try {
        const localCats = await getLocalCategories();
        setCategories(localCats);
      } catch (err) {
        console.error('JoddiApp: Error loading categories:', err);
      }
    };
    fetchCategories();

    const handleCategoriesChanged = () => fetchCategories();
    globalThis.addEventListener('joddi:categories-changed', handleCategoriesChanged);

    return () => {
      subscription.unsubscribe();
      globalThis.removeEventListener('joddi:categories-changed', handleCategoriesChanged);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      if (!session || isGuestMode) return;
      syncPendingTransactions()
        .then(() => getLocalTransactions())
        .then((localTransactions) => setTransactions(localTransactions))
        .catch((error) => console.error('Background sync error:', error));
    };

    globalThis.addEventListener('online', handleOnline);
    return () => globalThis.removeEventListener('online', handleOnline);
  }, [session, isGuestMode]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const mergedTransactions = await fetchRemoteTransactionsIntoLocal();
      setTransactions(mergedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      const localTransactions = await getLocalTransactions().catch(() => []);
      setTransactions(localTransactions);
      if (localTransactions.length === 0 || (typeof navigator !== 'undefined' && navigator.onLine)) {
        showAccessMessage('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!canWrite) {
      showAccessMessage(LOCAL_WRITE_BLOCKED_MESSAGE);
      return;
    }

    // สร้าง Transaction จำลองขึ้นมาใน List ทันที (Optimistic UI)
    const newTransaction = createOptimisticTransaction(t);
    setTransactions((prev) => [newTransaction, ...prev]);

    try {
      // บันทึกลง IndexedDB ในเครื่องก่อน
      await saveLocalTransaction(newTransaction);

      // พยายามส่งขึ้น Cloud (Supabase) ใน Background
      syncPendingTransactions()
        .then((result) => {
          if (result.failed.length > 0) {
            showAccessMessage('บันทึกในเครื่องแล้ว แต่ยัง sync ไม่สำเร็จ ระบบจะลองใหม่เมื่อออนไลน์');
          }
          return getLocalTransactions();
        })
        .then((localTransactions) => setTransactions(localTransactions))
        .catch((syncError) => console.error('Transaction background sync error:', syncError));
    } catch (error: any) {
      console.error('Error saving transaction locally:', error);
      // ถ้าบันทึกในเครื่องไม่สำเร็จ ให้เปลี่ยนสถานะเป็น 'failed' เพื่อให้ผู้ใช้รับทราบ
      const failedTransaction = {
        ...newTransaction,
        syncStatus: 'failed' as const,
        syncError: error?.message || 'Failed to save transaction locally',
      };
      setTransactions((prev) => prev.map((item) => (item.id === newTransaction.id ? failedTransaction : item)));
      showAccessMessage(mapMutationError(error?.message || 'Failed to save transaction locally'));
    }
  };

  const mapMutationError = (message: string) => {
    const normalized = message.toLowerCase();
    if (normalized.includes('row-level security')) return 'ไม่สามารถบันทึกข้อมูลได้: สิทธิ์ไม่ถูกต้อง (RLS)';
    if (normalized.includes('not authenticated')) return 'ต้อง Sign in ก่อนเพิ่มข้อมูล';
    return 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่';
  };

  const openGuestMode = () => {
    setIsGuestMode(true);
    setTransactions(buildDemoTransactions());
    setCurrentView('dashboard');
    setBaseView('dashboard');
    setLoading(false);
  };

  const closeGuestModeAndRequireAuth = () => {
    setIsGuestMode(false);
    setCurrentView('onboarding');
    setBaseView('dashboard');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await clearLocalTransactions().catch((clearError) => console.error('Offline cache clear error:', clearError));
    setIsGuestMode(false);
    setTransactions([]);
    setCurrentView('onboarding');
    setBaseView('dashboard');
  };

  const handleClearLocalData = async () => {
    await clearLocalTransactions();
    setTransactions([]);
    showAccessMessage('ล้างข้อมูลในเครื่องเรียบร้อย');
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const navigate = (nextView: ViewState, payload?: any) => {
    const blockedViewForReadOnly: ViewState[] = [
      'add_transaction',
      'review_receipt',
      'categories',
      'transaction_detail',
    ];

    if (!canWrite && blockedViewForReadOnly.includes(nextView)) {
      showAccessMessage(LOCAL_WRITE_BLOCKED_MESSAGE);
      return;
    }

    if (nextView === 'add_transaction' || nextView === 'transaction_detail') {
      if (currentView !== 'add_transaction' && currentView !== 'transaction_detail') {
        setBaseView(currentView);
      }
      if (nextView === 'transaction_detail' && typeof payload === 'string') {
        setSelectedTransactionId(payload);
      }
    } else {
      setBaseView(nextView);
      setSelectedTransactionId(null);
    }

    setCurrentView(nextView);
  };

  const contentView =
    currentView === 'add_transaction' || currentView === 'transaction_detail' ? baseView : currentView;

  const renderScreen = () => {
    if (!sessionChecked) return <ScreenFallback />;

    if (!session && !isGuestMode && contentView !== 'onboarding') {
      return (
        <AuthScreen
          onAuthSuccess={(session) => {
            if (session) setSession(session);
            setSessionChecked(true);
            setCurrentView('dashboard');
            setBaseView('dashboard');
            fetchTransactions();
          }}
          allowGuestReadOnly={allowGuestReadOnly}
          onContinueAsGuest={openGuestMode}
        />
      );
    }

    switch (contentView) {
      case 'onboarding':
        return <Onboarding onNavigate={navigate} />;
      case 'review_receipt':
        return (
          <ReviewReceipt
            onNavigate={navigate}
            onAddTransaction={handleAddTransaction}
            lang={lang}
            currency={currency}
          />
        );
      case 'transactions':
        return (
          <TransactionHistory
            onNavigate={navigate}
            transactions={transactions}
            categories={categories}
            lang={lang}
            currency={currency}
          />
        );
      case 'analytics':
        return (
          <AnalyticsDashboard
            onNavigate={navigate}
            transactions={transactions}
            categories={categories}
            lang={lang}
            currency={currency}
          />
        );
      case 'budget':
        return <BudgetScreen onNavigate={navigate} transactions={transactions} lang={lang} currency={currency} />;
      case 'categories':
        return (
          <CategoriesManagement onNavigate={navigate} transactions={transactions} lang={lang} currency={currency} />
        );
      case 'settings':
        return (
          <Settings
            onNavigate={navigate}
            isAuthenticated={isAuthenticated}
            onSignOut={handleSignOut}
            onRequestSignIn={closeGuestModeAndRequireAuth}
            onClearLocalData={handleClearLocalData}
            userEmail={session?.user?.email}
            userId={session?.user?.id}
            lang={lang}
            onLanguageChange={(newLang) => {
              setLang(newLang);
              globalThis.localStorage.setItem('language', newLang);
            }}
            currency={currency}
            onCurrencyChange={(newCurr) => {
              setCurrency(newCurr);
              globalThis.localStorage.setItem('currency', newCurr);
            }}
          />
        );
      case 'dashboard':
      default: {
        const userName =
          session?.user?.user_metadata?.display_name ||
          session?.user?.email?.split('@')[0] ||
          (isGuestMode ? 'ผู้ใช้ทั่วไป' : 'จดดี');
        return (
          <Dashboard
            onNavigate={navigate}
            onAddTransaction={handleAddTransaction}
            transactions={transactions}
            categories={categories}
            userName={userName}
            canCreateTransactions={canWrite}
            readOnlyMode={false}
            lang={lang}
            currency={currency}
          />
        );
      }
    }
  };

  return (
    <div className="h-dvh bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased flex justify-center overflow-hidden">
      <div className="w-full max-w-md bg-white dark:bg-background-dark shadow-2xl relative overflow-hidden h-full flex flex-col">
        {accessMessage && (
          <div className="absolute left-4 right-4 top-14 z-40 rounded-2xl bg-slate-900/90 text-white px-4 py-3 text-[11px] font-bold text-center shadow-lg">
            {accessMessage}
          </div>
        )}

        {/* Scrollable content area */}
        <div className="flex-1 min-h-0 overflow-y-auto ios-scroll app-scroll-shell bg-white dark:bg-background-dark">
          <AnimatePresence mode="wait">
            <motion.div
              key={contentView + (isGuestMode ? '-guest' : '-auth')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <Suspense fallback={<ScreenFallback />}>{renderScreen()}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <Suspense fallback={null}>
          {(session || isGuestMode) && (
            <BottomNav currentView={currentView} onNavigate={navigate} canCreate={canWrite} />
          )}
        </Suspense>

        {/* Add Transaction Overlay */}
        <AnimatePresence>
          {currentView === 'add_transaction' && canWrite && (
            <motion.div
              key="add_transaction_overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-h-[95%]"
              >
                <Suspense fallback={<ScreenFallback />}>
                  <AddTransaction
                    onNavigate={navigate}
                    onAddTransaction={handleAddTransaction}
                    returnView={baseView}
                    lang={lang}
                    currency={currency}
                  />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction Detail Overlay */}
        <AnimatePresence>
          {currentView === 'transaction_detail' && selectedTransactionId && (
            <motion.div
              key="transaction_detail_overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full h-full"
              >
                {(() => {
                  const tx = transactions.find(
                    (t) => t.id === selectedTransactionId || t.localId === selectedTransactionId,
                  );
                  if (!tx) {
                    // Fallback if transaction not found (shouldn't happen)
                    globalThis.setTimeout(() => navigate('dashboard'), 0);
                    return null;
                  }
                  return (
                    <Suspense fallback={<ScreenFallback />}>
                      <TransactionDetail
                        transaction={tx}
                        onNavigate={navigate}
                        lang={lang}
                        currency={currency}
                        onUpdate={() => fetchTransactions()}
                        returnView={baseView}
                      />
                    </Suspense>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
