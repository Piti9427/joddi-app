import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Session } from '@supabase/supabase-js';
import { supabase, allowGuestReadOnly } from './lib/supabase';

export type ViewState =
  | 'onboarding'
  | 'dashboard'
  | 'review_receipt'
  | 'add_transaction'
  | 'transactions'
  | 'analytics'
  | 'budget'
  | 'categories'
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
}

const READ_ONLY_WRITE_BLOCKED_MESSAGE = 'โหมด Read-only: กรุณา Sign in ก่อนเพิ่มหรือแก้ไขข้อมูล';

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
    },
    {
      id: 'demo-2',
      type: 'Expense',
      amount: 145.5,
      category: 'Food',
      merchant: 'Cafe',
      note: 'Demo data',
      date: new Date(now - 86400000).toISOString(),
    },
    {
      id: 'demo-3',
      type: 'Expense',
      amount: 89,
      category: 'Transport',
      merchant: 'BTS',
      note: 'Demo data',
      date: new Date(now).toISOString(),
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const accessMessageTimeout = useRef<number | null>(null);

  const canWrite = Boolean(session);

  useEffect(() => {
    return () => {
      if (accessMessageTimeout.current) {
        window.clearTimeout(accessMessageTimeout.current);
      }
    };
  }, []);

  const showAccessMessage = (message: string) => {
    setAccessMessage(message);
    if (accessMessageTimeout.current) {
      window.clearTimeout(accessMessageTimeout.current);
    }
    accessMessageTimeout.current = window.setTimeout(() => setAccessMessage(''), 3000);
  };

  useEffect(() => {
    document.documentElement.classList.remove('dark');

    if (localStorage.getItem('theme_v2_migrated') !== 'true') {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('theme_v2_migrated', 'true');
    } else if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }

    const initAuth = async () => {
      setSessionChecked(false);
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Auth getSession error:', error);
      }

      const existingSession = data.session;
      setSession(existingSession);
      setSessionChecked(true);

      if (existingSession) {
        setIsGuestMode(false);
        setCurrentView('dashboard');
        setBaseView('dashboard');
        await fetchTransactions(existingSession);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setSessionChecked(true);

      if (nextSession) {
        setIsGuestMode(false);
        setCurrentView('dashboard');
        setBaseView('dashboard');
        await fetchTransactions(nextSession);
      } else {
        setTransactions([]);
        setCurrentView('onboarding');
        setBaseView('dashboard');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTransactions = async (activeSession: Session) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data ?? []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      showAccessMessage('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!canWrite) {
      showAccessMessage(READ_ONLY_WRITE_BLOCKED_MESSAGE);
      return;
    }

    const tempId = Math.random().toString(36).substring(7);
    const newTransaction = { ...t, id: tempId };
    setTransactions((prev) => [newTransaction, ...prev]);

    try {
      const { data, error } = await supabase.from('transactions').insert([t]).select().single();

      if (error) throw error;

      if (data) {
        setTransactions((prev) => prev.map((item) => (item.id === tempId ? data : item)));
      }
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      setTransactions((prev) => prev.filter((item) => item.id !== tempId));
      showAccessMessage(mapMutationError(error?.message || 'Failed to save transaction'));
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
    setIsGuestMode(false);
    setTransactions([]);
    setCurrentView('onboarding');
    setBaseView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const navigate = (nextView: ViewState) => {
    const blockedViewForReadOnly: ViewState[] = ['add_transaction', 'review_receipt', 'categories'];

    if (!canWrite && blockedViewForReadOnly.includes(nextView)) {
      showAccessMessage(READ_ONLY_WRITE_BLOCKED_MESSAGE);
      return;
    }

    if (nextView === 'add_transaction') {
      if (currentView !== 'add_transaction') {
        setBaseView(currentView);
      }
    } else {
      setBaseView(nextView);
    }

    setCurrentView(nextView);
  };

  const contentView = currentView === 'add_transaction' ? baseView : currentView;

  const renderScreen = () => {
    if (!sessionChecked) return <ScreenFallback />;

    if (!session && !isGuestMode) {
      return (
        <AuthScreen
          onAuthSuccess={() => {
            setCurrentView('dashboard');
            setBaseView('dashboard');
          }}
          allowGuestReadOnly={allowGuestReadOnly}
          onContinueAsGuest={openGuestMode}
        />
      );
    }

    switch (contentView) {
      case 'onboarding':
        return <Onboarding onNavigate={navigate} />;
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={navigate}
            transactions={transactions}
            canCreateTransactions={canWrite}
            readOnlyMode={isGuestMode}
          />
        );
      case 'review_receipt':
        return <ReviewReceipt onNavigate={navigate} onAddTransaction={handleAddTransaction} />;
      case 'transactions':
        return <TransactionHistory onNavigate={navigate} transactions={transactions} />;
      case 'analytics':
        return <AnalyticsDashboard onNavigate={navigate} transactions={transactions} />;
      case 'budget':
        return <BudgetScreen onNavigate={navigate} transactions={transactions} />;
      case 'categories':
        return <CategoriesManagement onNavigate={navigate} transactions={transactions} />;
      case 'settings':
        return (
          <Settings
            onNavigate={navigate}
            isAuthenticated={canWrite}
            onSignOut={handleSignOut}
            onRequestSignIn={closeGuestModeAndRequireAuth}
          />
        );
      default:
        return (
          <Dashboard
            onNavigate={navigate}
            transactions={transactions}
            canCreateTransactions={canWrite}
            readOnlyMode={isGuestMode}
          />
        );
    }
  };

  return (
    <div className="min-h-dvh bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-background-dark shadow-2xl relative overflow-hidden min-h-dvh">
        {isGuestMode && (
          <div className="absolute top-3 right-3 z-40 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-wide">
            Read-only
          </div>
        )}

        {accessMessage && (
          <div className="absolute left-4 right-4 top-14 z-40 rounded-2xl bg-slate-900/90 text-white px-4 py-3 text-[11px] font-bold text-center shadow-lg">
            {accessMessage}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={contentView + (isGuestMode ? '-guest' : '-auth')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 overflow-y-auto bg-white dark:bg-background-dark pb-safe-nav"
          >
            <Suspense fallback={<ScreenFallback />}>{renderScreen()}</Suspense>
            <div className="h-24 safe-bottom" />
          </motion.div>
        </AnimatePresence>

        <Suspense fallback={null}>
          {(session || isGuestMode) && (
            <BottomNav currentView={currentView} onNavigate={navigate} canCreate={canWrite} />
          )}
        </Suspense>

        <AnimatePresence>
          {currentView === 'add_transaction' && canWrite && (
            <motion.div
              key="add_transaction_overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40"
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
                  />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
