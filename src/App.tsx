import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

export type ViewState = 'onboarding' | 'dashboard' | 'review_receipt' | 'add_transaction' | 'transactions' | 'analytics' | 'budget' | 'categories' | 'settings';
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

function ScreenFallback() {
  return (
    <div className="min-h-full bg-background-light dark:bg-background-dark flex items-center justify-center">
      <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const AuthScreen = lazy(() => import('./components/AuthScreen'));

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('onboarding');
  const [baseView, setBaseView] = useState<ViewState>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // FORCE light mode initially
    document.documentElement.classList.remove('dark');
    
    if (localStorage.getItem('theme_v2_migrated') !== 'true') {
      localStorage.setItem('theme', 'light');
      localStorage.setItem('theme_v2_migrated', 'true');
    } else {
      if (localStorage.getItem('theme') === 'dark') {
         document.documentElement.classList.add('dark');
      }
    }
    
    // Auth Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionChecked(true);
      if (session) fetchTransactions();
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchTransactions();
      else setTransactions([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([
        { id: '1', type: 'Income', amount: 4200, category: 'Income', merchant: 'Monthly Salary', note: 'Salary', date: new Date(Date.now() - 86400000).toISOString() },
        { id: '2', type: 'Expense', amount: 32.5, category: 'Food', merchant: 'Grocery Store', note: '', date: new Date().toISOString() },
        { id: '3', type: 'Expense', amount: 12.7, category: 'Lifestyle', merchant: 'Starbucks Coffee', note: '', date: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
    const tempId = Math.random().toString(36).substring(7);
    const newTransaction = { ...t, id: tempId };
    setTransactions(prev => [newTransaction, ...prev]);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([t])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTransactions(prev => prev.map(item => item.id === tempId ? data : item));
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      setTransactions(prev => prev.filter(item => item.id !== tempId));
      alert('Failed to save transaction');
    }
  };

  if (loading) {
    return <div className="min-h-dvh bg-background-light dark:bg-background-dark flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const navigate = (nextView: ViewState) => {
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
    if (!session) return <AuthScreen onAuthSuccess={() => setCurrentView('dashboard')} />;

    switch(contentView) {
      case 'onboarding': return <Onboarding onNavigate={navigate} />;
      case 'dashboard': return <Dashboard onNavigate={navigate} transactions={transactions} />;
      case 'review_receipt': return <ReviewReceipt onNavigate={navigate} onAddTransaction={handleAddTransaction} />;
      case 'transactions': return <TransactionHistory onNavigate={navigate} transactions={transactions} />;
      case 'analytics': return <AnalyticsDashboard onNavigate={navigate} transactions={transactions} />;
      case 'budget': return <BudgetScreen onNavigate={navigate} transactions={transactions} />;
      case 'categories': return <CategoriesManagement onNavigate={navigate} transactions={transactions} />;
      case 'settings': return <Settings onNavigate={navigate} />;
      default: return <Dashboard onNavigate={navigate} transactions={transactions} />;
    }
  };

  return (
    <div className="min-h-dvh bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-background-dark shadow-2xl relative overflow-hidden min-h-dvh">
        <AnimatePresence mode="wait">
          <motion.div 
            key={contentView} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 overflow-y-auto bg-white dark:bg-background-dark pb-safe-nav"
          >
            <Suspense fallback={<ScreenFallback />}>
              {renderScreen()}
            </Suspense>
            <div className="h-24 safe-bottom" />
          </motion.div>
        </AnimatePresence>

        <Suspense fallback={null}>
          {session && <BottomNav currentView={currentView} onNavigate={navigate} />}
        </Suspense>

        <AnimatePresence>
          {currentView === 'add_transaction' && (
            <motion.div key="add_transaction_overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40">
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="w-full max-h-[95%]">
                <Suspense fallback={<ScreenFallback />}>
                  <AddTransaction onNavigate={navigate} onAddTransaction={handleAddTransaction} returnView={baseView} />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
