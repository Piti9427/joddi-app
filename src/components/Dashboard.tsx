import React from 'react';
import { User, Bell, Wallet, TrendingUp, TrendingDown, PiggyBank, ShoppingBasket, Coffee, Banknote, Tv, Plus, Home, Receipt, PieChart, Landmark, Settings } from 'lucide-react';
import { ViewState, Transaction } from '../App';

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
    <div className="flex flex-col min-h-full pb-20 relative bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="flex items-center bg-surface dark:bg-surface-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-border dark:border-slate-800">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-highlight dark:bg-primary/20">
          <User className="text-primary" size={20} />
        </div>
        <h2 className="text-text-dark dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">My Finances</h2>
        <div className="flex w-10 items-center justify-end">
          <button onClick={() => onNavigate('settings')} className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-transparent text-secondary dark:text-slate-400 hover:bg-input-bg dark:hover:bg-slate-800 transition-colors">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="flex flex-col gap-1 rounded-2xl p-4 bg-surface dark:bg-surface-dark border border-border dark:border-slate-700 shadow-sm">
          <p className="text-text-secondary dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Today's Income</p>
          <p className="text-primary tracking-tight text-xl font-bold leading-tight">{formatCurrency(todayIncome)}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl p-4 bg-surface dark:bg-surface-dark border border-border dark:border-slate-700 shadow-sm">
          <p className="text-text-secondary dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Today's Expenses</p>
          <p className="text-text-dark dark:text-slate-200 tracking-tight text-xl font-bold leading-tight">{formatCurrency(todayExpense)}</p>
        </div>
        <div className="col-span-2 flex flex-col gap-1 rounded-2xl p-5 bg-primary text-white shadow-xl shadow-primary/10">
          <p className="text-white/80 text-sm font-medium opacity-90">Current Balance</p>
          <div className="flex items-center justify-between">
            <p className="tracking-tight text-4xl font-extrabold leading-tight">{formatCurrency(balance)}</p>
            <Wallet size={32} className="opacity-70" />
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="flex flex-col mt-2">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h3 className="text-text-dark dark:text-slate-100 text-lg font-bold">This Month</h3>
          <button onClick={() => onNavigate('analytics')} className="text-secondary text-sm font-semibold hover:text-primary transition-colors">View Analytics</button>
        </div>
        <div className="flex px-4 gap-3">
          <div className="flex flex-1 flex-col gap-3 rounded-2xl p-4 bg-income-bg/60 dark:bg-income/10 border border-income/20 dark:border-income/20">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark flex items-center justify-center shadow-sm">
              <TrendingUp className="text-income" size={20} />
            </div>
            <div>
              <p className="text-secondary dark:text-slate-400 text-xs font-semibold uppercase">Income</p>
              <p className="text-income dark:text-income text-lg font-bold">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 rounded-2xl p-4 bg-expense-bg/60 dark:bg-expense/10 border border-expense/20 dark:border-expense/20 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark flex items-center justify-center shadow-sm">
              <TrendingDown className="text-expense" size={20} />
            </div>
            <div>
              <p className="text-text-secondary dark:text-slate-400 text-xs font-semibold uppercase">Expenses</p>
              <p className="text-text-dark dark:text-slate-200 text-lg font-bold">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 rounded-2xl p-4 bg-highlight dark:bg-grass/20 border border-grass dark:border-grass/30">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark flex items-center justify-center shadow-sm">
              <PiggyBank className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-primary dark:text-grass text-xs font-semibold uppercase">Savings</p>
              <p className="text-primary dark:text-grass text-lg font-bold">{formatCurrency(savings)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="flex flex-col px-4 pb-8 mt-2 flex-1">
        <div className="flex items-center justify-between py-5">
          <h3 className="text-text-dark dark:text-slate-100 text-lg font-bold">Recent Transactions</h3>
          <button onClick={() => onNavigate('transactions')} className="text-secondary text-sm font-medium hover:text-primary transition-colors">See All</button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 10).map(t => {
            const isExpense = t.type === 'Expense';
            let Icon = Banknote;
            let iconColor = 'text-income';
            let bgConfig = 'bg-income-bg dark:bg-income/20';
            
            if (isExpense) {
              iconColor = 'text-expense';
              bgConfig = 'bg-expense-bg dark:bg-expense/20';
              if (t.category === 'Food') {
                Icon = ShoppingBasket; 
              } else if (t.category === 'Lifestyle' || t.category === 'Coffee') {
                Icon = Coffee; 
              } else {
                Icon = Receipt; 
              }
            }

            return (
              <TransactionItem 
                key={t.id}
                icon={<Icon className={iconColor} size={22} />} 
                bg={bgConfig} 
                title={t.merchant || t.category} 
                subtitle={`${t.category} • ${new Date(t.date).toLocaleDateString()}`} 
                amount={`${isExpense ? '-' : '+'}${formatCurrency(t.amount)}`} 
                amountColor={isExpense ? 'text-text-dark dark:text-slate-100' : 'text-income dark:text-income'} 
              />
            );
          })}
        </div>
      </div>

    </div>
  );
}

function TransactionItem({ icon, bg, title, subtitle, amount, amountColor, onClick }: any) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer bg-surface dark:bg-surface-dark p-3 rounded-2xl border border-transparent hover:border-border transition-colors" onClick={onClick}>
      <div className={`size-12 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 flex justify-between items-center">
        <div>
          <p className="text-text-dark dark:text-slate-100 font-bold text-[15px]">{title}</p>
          <p className="text-text-secondary dark:text-slate-500 text-xs font-medium mt-0.5">{subtitle}</p>
        </div>
        <p className={`${amountColor} font-bold text-[15px]`}>{amount}</p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 px-2 ${active ? 'text-primary' : 'text-secondary hover:text-text-dark dark:hover:text-slate-300 transition-colors'}`}>
      {icon}
      <p className="text-[10px] font-bold tracking-wide">{label}</p>
    </button>
  );
}

