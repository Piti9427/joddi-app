import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { ReviewReceipt } from './components/ReviewReceipt';
import { AddTransaction } from './components/AddTransaction';
import { TransactionHistory } from './components/TransactionHistory';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { BudgetScreen } from './components/BudgetScreen';
import { CategoriesManagement } from './components/CategoriesManagement';
import { Settings } from './components/Settings';
import { supabase } from './lib/supabase';

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

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('onboarding');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize dark mode from localStorage only. Default to light mode (creamy/minimal).
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    fetchTransactions();
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
      // Fallback data if Supabase is not set up yet
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
    // Optimistic UI update
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

      // Update with real ID from database
      if (data) {
        setTransactions(prev => prev.map(item => item.id === tempId ? data : item));
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      // Revert optimistic update on error
      setTransactions(prev => prev.filter(item => item.id !== tempId));
      alert('Failed to save transaction');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const renderScreen = () => {
    switch(currentView) {
      case 'onboarding': return <Onboarding onNavigate={setCurrentView} />;
      case 'dashboard': return <Dashboard onNavigate={setCurrentView} transactions={transactions} />;
      case 'review_receipt': return <ReviewReceipt onNavigate={setCurrentView} onAddTransaction={handleAddTransaction} />;
      case 'transactions': return <TransactionHistory onNavigate={setCurrentView} transactions={transactions} />;
      case 'analytics': return <AnalyticsDashboard onNavigate={setCurrentView} transactions={transactions} />;
      case 'budget': return <BudgetScreen onNavigate={setCurrentView} transactions={transactions} />;
      case 'categories': return <CategoriesManagement onNavigate={setCurrentView} transactions={transactions} />;
      case 'settings': return <Settings onNavigate={setCurrentView} />;
      case 'add_transaction': return <Dashboard onNavigate={setCurrentView} transactions={transactions} />; // AddTransaction is an overlay
      default: return <Dashboard onNavigate={setCurrentView} transactions={transactions} />;
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-background-dark shadow-2xl relative overflow-hidden min-h-[100dvh]">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentView !== 'add_transaction' ? currentView : 'dashboard'} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 overflow-y-auto bg-white dark:bg-background-dark"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {currentView === 'add_transaction' && (
            <motion.div key="add_transaction_overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40">
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="w-full max-h-[95%]">
                <AddTransaction onNavigate={setCurrentView} onAddTransaction={handleAddTransaction} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
