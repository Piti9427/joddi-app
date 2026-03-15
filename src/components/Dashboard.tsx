import React, { useMemo } from 'react';
import {
  User,
  Bell,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShoppingBasket,
  Coffee,
  Banknote,
  Receipt,
  Settings,
  ChevronRight,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  PieChart,
  Landmark,
} from 'lucide-react';
import { ViewState, Transaction, TransactionType } from '../App';
import { motion } from 'motion/react';
import { formatDateShort, formatMoney } from '../lib/formatters';

const QUICK_ADD_TYPE_KEY = 'quick_add_type';

export function Dashboard({
  onNavigate,
  transactions,
  canCreateTransactions = true,
  readOnlyMode = false,
}: {
  onNavigate: (v: ViewState) => void;
  transactions: Transaction[];
  canCreateTransactions?: boolean;
  readOnlyMode?: boolean;
}) {
  const {
    todayIncome,
    todayExpense,
    totalIncome,
    totalExpense,
    balance,
    monthIncome,
    monthExpense,
    monthNet,
    monthSpendRate,
    topExpenseCategory,
    recentTransactions,
  } = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();

    const monthCategoryExpenseMap: Record<string, number> = {};
    let todayIncomeValue = 0;
    let todayExpenseValue = 0;
    let totalIncomeValue = 0;
    let totalExpenseValue = 0;
    let monthIncomeValue = 0;
    let monthExpenseValue = 0;

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const isCurrentMonth =
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear();

      if (transaction.type === 'Income') {
        totalIncomeValue += transaction.amount;
        if (transactionDate.toDateString() === today) todayIncomeValue += transaction.amount;
        if (isCurrentMonth) monthIncomeValue += transaction.amount;
      } else {
        totalExpenseValue += transaction.amount;
        if (transactionDate.toDateString() === today) todayExpenseValue += transaction.amount;
        if (isCurrentMonth) {
          monthExpenseValue += transaction.amount;
          monthCategoryExpenseMap[transaction.category] = (monthCategoryExpenseMap[transaction.category] || 0) + transaction.amount;
        }
      }
    });

    const bestCategory = Object.entries(monthCategoryExpenseMap)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }))[0];

    const netBalance = totalIncomeValue - totalExpenseValue;
    const monthNetValue = monthIncomeValue - monthExpenseValue;
    const spendRate = monthIncomeValue > 0 ? Math.min((monthExpenseValue / monthIncomeValue) * 100, 999) : 0;

    return {
      todayIncome: todayIncomeValue,
      todayExpense: todayExpenseValue,
      totalIncome: totalIncomeValue,
      totalExpense: totalExpenseValue,
      balance: netBalance,
      monthIncome: monthIncomeValue,
      monthExpense: monthExpenseValue,
      monthNet: monthNetValue,
      monthSpendRate: spendRate,
      topExpenseCategory: bestCategory,
      recentTransactions: transactions.slice(0, 6),
    };
  }, [transactions]);

  const formatCurrency = (value: number, maximumFractionDigits = 0) =>
    formatMoney(value, {
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
    });

  const openQuickAdd = (type: TransactionType) => {
    if (!canCreateTransactions) return;
    try {
      window.sessionStorage.setItem(QUICK_ADD_TYPE_KEY, type);
    } catch {
      // Ignore storage errors and continue navigation.
    }
    onNavigate('add_transaction');
  };

  const monthStatus = monthNet >= 0 ? 'Positive Flow' : 'Negative Flow';
  const monthStatusStyle = monthNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="flex flex-col min-h-full pb-6 relative bg-slate-50 dark:bg-background-dark">
      <header className="flex items-center bg-white dark:bg-surface-dark px-4 pb-3 justify-between sticky top-0 z-20 border-b border-border/70 dark:border-slate-800/80" style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}>
        <div className="flex items-center gap-3">
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20 bg-primary/10 flex items-center justify-center cursor-pointer"
          >
            <User className="text-primary" size={20} />
          </motion.div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em]">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <h2 className="text-text-dark dark:text-slate-100 text-base font-extrabold leading-tight">Financial Overview</h2>
          </div>
        </div>
        <div className="flex gap-1">
          <motion.button
            aria-label="Notifications"
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center rounded-full h-10 w-10 bg-input-bg dark:bg-slate-800 text-secondary hover:text-primary transition-colors relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-800"></span>
          </motion.button>
          <motion.button
            aria-label="Settings"
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('settings')}
            className="flex items-center justify-center rounded-full h-10 w-10 bg-input-bg dark:bg-slate-800 text-secondary hover:text-primary transition-colors"
          >
            <Settings size={20} />
          </motion.button>
        </div>
      </header>

      {readOnlyMode && (
        <section className="px-4 pt-3">
          <div className="rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-black tracking-wide uppercase px-4 py-2.5 text-center">
            Guest read-only mode: Sign in to add or edit data
          </div>
        </section>
      )}

      <section className="px-4 py-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="bg-gradient-to-br from-emerald-500 via-primary to-emerald-700 rounded-[2.2rem] p-6 shadow-2xl shadow-primary/25 text-white relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 p-4 opacity-10">
            <Wallet size={140} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white/75 text-xs font-bold uppercase tracking-wider">Available Balance</span>
              <CreditCard size={18} className="text-white/45" />
            </div>
            <motion.h1
              key={balance}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[2.2rem] leading-none font-black tracking-tight mb-6 tabular-nums"
            >
              {formatCurrency(balance)}
            </motion.h1>

            <div className="grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-white/65">
                  <ArrowUpRight size={14} className="text-emerald-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Total Income</span>
                </div>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-white/65">
                  <ArrowDownRight size={14} className="text-rose-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Total Expense</span>
                </div>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(totalExpense)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="px-4 grid grid-cols-3 gap-2">
        <QuickActionCard icon={<Plus size={18} />} label="Expense" onClick={() => openQuickAdd('Expense')} disabled={!canCreateTransactions} />
        <QuickActionCard icon={<TrendingUp size={18} />} label="Income" onClick={() => openQuickAdd('Income')} disabled={!canCreateTransactions} />
        <QuickActionCard icon={<PieChart size={18} />} label="Analytics" onClick={() => onNavigate('analytics')} />
      </section>

      <section className="px-4 py-3 grid grid-cols-2 gap-3">
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
            <p className="text-secondary text-[10px] font-bold uppercase mb-0.5">Today In</p>
            <p className="text-sm font-bold text-text-dark dark:text-white tabular-nums">{formatCurrency(todayIncome, 2)}</p>
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
            <p className="text-secondary text-[10px] font-bold uppercase mb-0.5">Today Out</p>
            <p className="text-sm font-bold text-text-dark dark:text-white tabular-nums">{formatCurrency(todayExpense, 2)}</p>
          </div>
        </motion.div>
      </section>

      <section className="px-4">
        <div className="bg-white dark:bg-surface-dark border border-border/70 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-secondary font-black">This Month</p>
              <h3 className="text-lg font-black text-text-dark dark:text-white tabular-nums">{formatCurrency(monthNet)}</h3>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${monthStatusStyle}`}>{monthStatus}</span>
          </div>

          <div className="space-y-2">
            <MetricRow label="Income" value={formatCurrency(monthIncome)} positive />
            <MetricRow label="Expense" value={formatCurrency(monthExpense)} />
            <MetricRow label="Spend / Income" value={`${monthSpendRate.toFixed(0)}%`} warning={monthSpendRate > 80} />
            <MetricRow
              label="Top Category"
              value={topExpenseCategory ? `${topExpenseCategory.category} (${formatCurrency(topExpenseCategory.amount)})` : 'No expense yet'}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col px-4 mt-5">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-text-dark dark:text-slate-100 text-lg font-black tracking-tight">Recent Activity</h3>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1 text-primary text-xs font-bold transition-all"
          >
            See all
            <ChevronRight size={14} />
          </motion.button>
        </div>

        <div className="space-y-2 pb-4">
          {recentTransactions.length === 0 ? (
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
                disabled={!canCreateTransactions}
                onClick={() => onNavigate('add_transaction')}
                className={`mt-4 text-xs font-bold underline underline-offset-4 ${canCreateTransactions ? 'text-primary' : 'text-secondary opacity-60 cursor-not-allowed'}`}
              >
                {canCreateTransactions ? 'Add your first one' : 'Sign in to add transactions'}
              </button>
            </motion.div>
          ) : (
            recentTransactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                index={index}
                type={transaction.type}
                category={transaction.category}
                merchant={transaction.merchant}
                date={transaction.date}
                amount={transaction.amount}
              />
            ))
          )}
        </div>
      </section>

      <section className="px-4 pb-2">
        <button
          onClick={() => onNavigate('budget')}
          className="w-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-2xl py-3.5 px-4 text-sm font-bold flex items-center justify-center gap-2"
        >
          <Landmark size={16} />
          Open Budget Planner
        </button>
      </section>

      <div className="h-3" />
    </div>
  );
}

function QuickActionCard({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`bg-white dark:bg-surface-dark border border-border dark:border-slate-800 rounded-2xl py-3 px-2 shadow-sm flex flex-col items-center justify-center gap-1 ${
        disabled ? 'text-secondary opacity-60 cursor-not-allowed' : 'text-text-dark dark:text-white'
      }`}
    >
      <span className="text-primary">{icon}</span>
      <span className="text-[10px] uppercase tracking-wide font-black">{label}</span>
    </motion.button>
  );
}

function MetricRow({ label, value, positive, warning }: { label: string; value: string; positive?: boolean; warning?: boolean }) {
  const textStyle = warning ? 'text-amber-600 dark:text-amber-400' : positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-dark dark:text-white';

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-secondary font-bold uppercase tracking-wide">{label}</span>
      <span className={`font-black tabular-nums ${textStyle}`}>{value}</span>
    </div>
  );
}

function TransactionItem({
  type,
  category,
  merchant,
  date,
  amount,
  index,
}: {
  key?: React.Key;
  type: TransactionType;
  category: string;
  merchant?: string;
  date: string;
  amount: number;
  index: number;
}) {
  const isExpense = type === 'Expense';

  const getIcon = () => {
    const normalized = category.toLowerCase();

    if (normalized.includes('food')) return <ShoppingBasket size={22} />;
    if (normalized.includes('coffee')) return <Coffee size={22} />;
    if (normalized.includes('income') || normalized.includes('salary')) return <Banknote size={22} />;
    if (normalized.includes('transport')) return <TrendingUp size={22} />;
    return <Receipt size={22} />;
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.08 + index * 0.05 }}
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
            <span className="text-[10px] font-bold text-secondary opacity-60 uppercase">{formatDateShort(date)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`${isExpense ? 'text-text-dark dark:text-slate-100' : 'text-income dark:text-income'} font-black text-[16px] tabular-nums`}>
            {isExpense ? '-' : '+'}
            {formatMoney(amount, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
