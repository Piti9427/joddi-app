import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { ReviewReceipt } from './components/ReviewReceipt';
import { AddTransaction } from './components/AddTransaction';

export type ViewState = 'onboarding' | 'dashboard' | 'review_receipt' | 'add_transaction';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('onboarding');

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-background-dark shadow-2xl relative overflow-hidden min-h-[100dvh]">
        <AnimatePresence mode="wait">
          {currentView === 'onboarding' && (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto bg-white dark:bg-background-dark">
              <Onboarding onNavigate={setCurrentView} />
            </motion.div>
          )}
          {(currentView === 'dashboard' || currentView === 'add_transaction') && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto bg-white dark:bg-background-dark">
              <Dashboard onNavigate={setCurrentView} />
            </motion.div>
          )}
          {currentView === 'review_receipt' && (
            <motion.div key="review_receipt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-y-auto bg-white dark:bg-background-dark">
              <ReviewReceipt onNavigate={setCurrentView} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentView === 'add_transaction' && (
            <motion.div key="add_transaction_overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40">
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="w-full max-h-[95%]">
                <AddTransaction onNavigate={setCurrentView} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
