import React from 'react';
import { User, Bell, Wallet, TrendingUp, TrendingDown, ShoppingBasket, Coffee, Banknote, Plus, Home, Receipt, PieChart, Landmark, Settings, ChevronRight, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ViewState, Transaction } from '../App';
import { motion } from 'motion/react';

export function Dashboard({ onNavigate, transactions }: { onNavigate: (v: ViewState) => void; transactions: Transaction[] }) {
  const today = new Date().toDateString();
  const todayTransactions = transactions.filter(t => new Date(t.date).toDateString() === today);
  
  const todayIncome = todayTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savings = totalIncome - totalExpense > 0 ? totalIncome - totalExpense : 0;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="flex flex-col min-h-full pb-32 relative bg-slate-50 dark:bg-background-dark">
      {/* Premium Header */}
      <header className="flex items-center bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md p-4 pb-3 justify-between sticky top-0 z-20 transition-all">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20 bg-primary/10 flex items-center justify-center cursor-pointer"
          >
            <User className="text-primary" size={20} />
          </motion.div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em]">Good Morning ☀️</p>
            <h2 className="text-text-dark dark:text-slate-100 text-base font-extrabold leading-tight">Joddi User</h2>
          </div>
        </div>
        <div className="flex gap-1">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center rounded-full h-10 w-10 bg-input-bg dark:bg-slate-800 text-secondary hover:text-primary transition-colors relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-800"></span>
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('settings')} 
            className="flex items-center justify-center rounded-full h-10 w-10 bg-input-bg dark:bg-slate-800 text-secondary hover:text-primary transition-colors"
          >
            <Settings size={20} />
          </motion.button>
        </div>
      </header>

      {/* Main Wallet Card */}
      <section className="px-4 py-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="bg-primary bg-gradient-to-br from-primary to-emerald-600 rounded-[2.5rem] p-8 shadow-2xl shadow-primary/30 text-white relative overflow-hidden group"
        >
          <motion.div 
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700"
          >
            <Wallet size={160} />
          </motion.div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Available Balance</span>
              <CreditCard size={18} className="text-white/40" />
            </div>
            <motion.h1 
              key={balance}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-black tracking-tight mb-8"
            >
              {formatCurrency(balance)}
            </motion.h1>
            
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-white/60">
                  <ArrowUpRight size={14} className="text-emerald-300" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Income</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-white/60">
                  <ArrowDownRight size={14} className="text-rose-300" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Expenses</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(totalExpense)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Quick Summary Cards */}
      <section className="px-4 py-2 grid grid-cols-2 gap-3">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-surface-dark border border-border dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center gap-3"
        >
          <div className="size-10 rounded-2xl bg-income-bg/60 dark:bg-income/10 flex items-center justify-center text-income">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-secondary text-[10px] font-bold uppercase mb-0.5">Savings</p>
            <p className="text-sm font-bold text-text-dark dark:text-white">{formatCurrency(savings)}</p>
          </div>
        </motion.div>
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-surface-dark border border-border dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center gap-3"
        >
          <div className="size-10 rounded-2xl bg-expense-bg/60 dark:bg-expense/10 flex items-center justify-center text-expense">
            <TrendingDown size={18} />
          </div>
          <div>
            <p className="text-secondary text-[10px] font-bold uppercase mb-0.5">Today's</p>
            <p className="text-sm font-bold text-text-dark dark:text-white">{formatCurrency(todayExpense)}</p>
          </div>
        </motion.div>
      </section>

      {/* Recent Transactions Section */}
      <section className="flex flex-col px-4 mt-6">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-text-dark dark:text-slate-100 text-lg font-black tracking-tight">Recent Activity</h3>
          <motion.button 
            whileHover={{ x: 5 }}
            onClick={() => onNavigate('transactions')} 
            className="flex items-center gap-1 text-primary text-xs font-bold transition-all"
          >
            See all
            <ChevronRight size={14} />
          </motion.button>
        </div>
        
        <div className="space-y-2 pb-4">
          {transactions.length === 0 ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 bg-white dark:bg-input-bg/10 rounded-[2rem] border-2 border-dashed border-border dark:border-slate-800"
            >
               <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                 <Receipt size={32} />
               </div>
               <p className="text-secondary font-bold text-sm">No transactions yet</p>
               <button 
                 onClick={() => onNavigate('add_transaction')}
                 className="mt-4 text-primary text-xs font-bold underline underline-offset-4"
               >
                 Add your first one
               </button>
            </motion.div>
          ) : (
            transactions.slice(0, 6).map((t, index) => (
              <TransactionItem 
                key={t.id}
                index={index}
                type={t.type}
                category={t.category}
                merchant={t.merchant}
                date={t.date}
                amount={t.amount}
                formatCurrency={formatCurrency}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function TransactionItem({ type, category, merchant, date, amount, formatCurrency, index }: any) {
  const isExpense = type === 'Expense';
  
  const getIcon = () => {
    if (category.toLowerCase().includes('food')) return <ShoppingBasket size={22} />;
    if (category.toLowerCase().includes('coffee')) return <Coffee size={22} />;
    if (category.toLowerCase().includes('income')) return <Banknote size={22} />;
    if (category.toLowerCase().includes('transport')) return <TrendingUp size={22} />;
    return <Receipt size={22} />;
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-3xl border border-border/50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer shadow-sm"
    >
      <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isExpense ? 'bg-expense-bg/60 text-expense' : 'bg-income-bg/60 text-income'}`}>
        {getIcon()}
      </div>
      <div className="flex-1 flex justify-between items-center overflow-hidden">
        <div className="overflow-hidden">
          <p className="text-text-dark dark:text-slate-100 font-extrabold text-[15px] truncate">{merchant || category}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-tight">{category}</span>
            <span className="size-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
            <span className="text-[10px] font-bold text-secondary opacity-60 uppercase">{new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`${isExpense ? 'text-text-dark dark:text-slate-100' : 'text-income dark:text-income'} font-black text-[16px]`}>
            {isExpense ? '-' : '+'}{formatCurrency(amount)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
