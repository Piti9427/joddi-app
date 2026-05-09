import React, { useMemo } from 'react';
import {
  User,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShoppingBasket,
  Coffee,
  Banknote,
  Receipt,
  Settings,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Plus,
} from 'lucide-react';
import { ViewState, Transaction, TransactionType } from '../App';
import { motion } from 'motion/react';
import { formatDateShort, formatMoney } from '../lib/formatters';

const QUICK_ADD_TYPE_KEY = 'quick_add_type';

export function Dashboard({
  onNavigate,
  onAddTransaction,
  transactions,
  userName,
  canCreateTransactions = true,
  readOnlyMode = false,
}: Readonly<{
  onNavigate: (v: ViewState) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void | Promise<void>;
  transactions: Transaction[];
  userName?: string;
  canCreateTransactions?: boolean;
  readOnlyMode?: boolean;
}>) {
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
        transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();

      if (transaction.type === 'Income') {
        totalIncomeValue += transaction.amount;
        if (transactionDate.toDateString() === today) todayIncomeValue += transaction.amount;
        if (isCurrentMonth) monthIncomeValue += transaction.amount;
      } else {
        totalExpenseValue += transaction.amount;
        if (transactionDate.toDateString() === today) todayExpenseValue += transaction.amount;
        if (isCurrentMonth) {
          monthExpenseValue += transaction.amount;
          monthCategoryExpenseMap[transaction.category] =
            (monthCategoryExpenseMap[transaction.category] || 0) + transaction.amount;
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
      recentTransactions: transactions.slice(0, 5),
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
      globalThis.sessionStorage.setItem(QUICK_ADD_TYPE_KEY, type);
    } catch {
      // Ignore storage errors and continue navigation.
    }
    onNavigate('add_transaction');
  };

  return (
    <div className="flex flex-col min-h-full pb-5 relative bg-slate-50 dark:bg-background-dark">
      {/* Header */}
      <header
        className="flex items-center bg-white dark:bg-surface-dark px-5 pb-3 justify-between sticky top-0 z-20 border-b border-border/50 dark:border-slate-800/60"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/15 bg-primary/8 flex items-center justify-center">
            <User className="text-primary" size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em]">
              {new Date().toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <h2 className="text-text-dark dark:text-slate-100 text-base font-extrabold leading-tight">{userName || 'จดดี'}</h2>
          </div>
        </div>
        <motion.button
          aria-label="Settings"
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('settings')}
          className="flex items-center justify-center rounded-full h-10 w-10 bg-input-bg dark:bg-slate-800 text-secondary hover:text-primary transition-colors"
        >
          <Settings size={20} />
        </motion.button>
      </header>

      {readOnlyMode && (
        <section className="px-4 pt-3">
          <div className="rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-black tracking-wide uppercase px-4 py-2.5 text-center">
            โหมดทดลองอ่านอย่างเดียว: เข้าสู่ระบบก่อนเพิ่มหรือแก้ไขข้อมูล
          </div>
        </section>
      )}

      {/* Balance Card — primary focus */}
      <section className="px-4 pt-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border/60 dark:border-slate-800"
        >
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-secondary text-xs font-semibold mb-1">ยอดคงเหลือทั้งหมด</p>
              <motion.h1
                key={balance}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[2rem] leading-none font-black text-text-dark dark:text-white tabular-nums"
              >
                {formatCurrency(balance)}
              </motion.h1>
            </div>
            <div className="size-11 rounded-2xl bg-primary/8 dark:bg-primary/15 flex items-center justify-center text-primary">
              <Wallet size={22} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-income-bg dark:bg-income/10 flex items-center justify-center text-income">
                <ArrowUpRight size={16} />
              </div>
              <div>
                <p className="text-secondary text-[10px] font-semibold">รายรับรวม</p>
                <p className="text-sm font-bold text-text-dark dark:text-white tabular-nums">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-expense-bg dark:bg-expense/10 flex items-center justify-center text-expense">
                <ArrowDownRight size={16} />
              </div>
              <div>
                <p className="text-secondary text-[10px] font-semibold">รายจ่ายรวม</p>
                <p className="text-sm font-bold text-text-dark dark:text-white tabular-nums">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Today Summary */}
      <section className="px-4 pt-3 grid grid-cols-2 gap-3">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-surface-dark border border-border/60 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm flex items-center gap-3"
        >
          <div className="size-9 rounded-xl bg-income-bg/60 dark:bg-income/10 flex items-center justify-center text-income">
            <TrendingUp size={16} />
          </div>
          <div>
            <p className="text-secondary text-[10px] font-semibold mb-0.5">รับวันนี้</p>
            <p className="text-sm font-bold text-text-dark dark:text-white tabular-nums">
              {formatCurrency(todayIncome, 2)}
            </p>
          </div>
        </motion.div>
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-surface-dark border border-border/60 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm flex items-center gap-3"
        >
          <div className="size-9 rounded-xl bg-expense-bg/60 dark:bg-expense/10 flex items-center justify-center text-expense">
            <TrendingDown size={16} />
          </div>
          <div>
            <p className="text-secondary text-[10px] font-semibold mb-0.5">จ่ายวันนี้</p>
            <p className="text-sm font-bold text-text-dark dark:text-white tabular-nums">
              {formatCurrency(todayExpense, 2)}
            </p>
          </div>
        </motion.div>
      </section>

      {/* Quick Actions — semantic colors for clarity */}
      <section className="px-4 pt-4 grid grid-cols-4 gap-2.5">
        <QuickActionCard
          icon={<Plus size={20} />}
          label="จ่าย"
          onClick={() => openQuickAdd('Expense')}
          disabled={!canCreateTransactions}
          colorClass="bg-expense/10 text-expense border-expense/20"
        />
        <QuickActionCard
          icon={<TrendingUp size={20} />}
          label="รายรับ"
          onClick={() => openQuickAdd('Income')}
          disabled={!canCreateTransactions}
          colorClass="bg-income/10 text-income border-income/20"
        />
        <QuickActionCard
          icon={<Receipt size={20} />}
          label="สลิป"
          onClick={() => onNavigate('review_receipt')}
          disabled={!canCreateTransactions}
          colorClass="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-border/60"
        />
        <QuickActionCard 
          icon={<Landmark size={20} />} 
          label="งบประมาณ" 
          onClick={() => onNavigate('budget')} 
          colorClass="bg-primary/10 text-primary border-primary/20"
        />
      </section>

      {/* Monthly Budget Summary — compact */}
      <section className="px-4 pt-4">
        <div className="bg-white dark:bg-surface-dark border border-border/60 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] text-secondary font-semibold">สถานะงบเดือนนี้</p>
              <h3 className="text-lg font-black text-text-dark dark:text-white tabular-nums">
                {formatCurrency(monthNet)}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('budget')}
              className="rounded-xl bg-primary/10 dark:bg-primary/20 text-primary px-3 py-2 text-[11px] font-bold hover:bg-primary/15 transition-colors"
            >
              จัดการ
            </button>
          </div>

          <div className="space-y-1.5">
            <MetricRow label="รายรับ" value={formatCurrency(monthIncome)} positive />
            <MetricRow label="รายจ่าย" value={formatCurrency(monthExpense)} />
            <MetricRow label="ใช้เทียบรายรับ" value={`${monthSpendRate.toFixed(0)}%`} warning={monthSpendRate > 80} />
            <MetricRow
              label="หมวดที่ใช้มากสุด"
              value={
                topExpenseCategory
                  ? `${topExpenseCategory.category} (${formatCurrency(topExpenseCategory.amount)})`
                  : 'ยังไม่มีรายจ่าย'
              }
            />
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="flex flex-col px-4 mt-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-text-dark dark:text-slate-100 text-base font-extrabold">รายการล่าสุด</h3>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1 text-primary text-xs font-bold transition-all"
          >
            ดูทั้งหมด
            <ChevronRight size={14} />
          </motion.button>
        </div>

        <div className="space-y-2 pb-4">
          {recentTransactions.length === 0 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 bg-white dark:bg-input-bg/10 rounded-2xl border-2 border-dashed border-border dark:border-slate-800"
            >
              <div className="size-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-400">
                <Receipt size={28} />
              </div>
              <p className="text-secondary font-bold text-sm">ยังไม่มีรายการ</p>
              <button
                disabled={!canCreateTransactions}
                onClick={() => onNavigate('add_transaction')}
                className={`mt-3 text-xs font-bold underline underline-offset-4 ${canCreateTransactions ? 'text-primary' : 'text-secondary opacity-60 cursor-not-allowed'}`}
              >
                {canCreateTransactions ? 'เพิ่มรายการแรก' : 'เข้าสู่ระบบเพื่อเพิ่มรายการ'}
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

      <div className="h-3" />
    </div>
  );
}

function QuickActionCard({
  icon,
  label,
  onClick,
  disabled = false,
  colorClass = '',
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  colorClass?: string;
  key?: React.Key;
}>) {
  const baseClasses = colorClass 
    ? `${colorClass} border`
    : 'bg-white dark:bg-surface-dark border border-border/60 dark:border-slate-800 text-text-dark dark:text-white shadow-sm';

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl py-4 px-2 flex flex-col items-center justify-center gap-1.5 min-h-[80px] transition-all ${baseClasses} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <span>{icon}</span>
      <span className="text-[11px] font-extrabold leading-none">{label}</span>
    </motion.button>
  );
}

function MetricRow({
  label,
  value,
  positive,
  warning,
}: Readonly<{
  label: string;
  value: string;
  positive?: boolean;
  warning?: boolean;
  key?: React.Key;
}>) {
  const getTextStyle = () => {
    if (warning) return 'text-amber-600 dark:text-amber-400';
    if (positive) return 'text-income dark:text-income';
    return 'text-text-dark dark:text-white';
  };
  const textStyle = getTextStyle();

  return (
    <div className="flex items-center justify-between text-xs gap-3 py-0.5">
      <span className="text-secondary font-semibold">{label}</span>
      <span className={`font-bold tabular-nums ${textStyle}`}>{value}</span>
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
}: Readonly<{
  type: TransactionType;
  category: string;
  merchant?: string;
  date: string;
  amount: number;
  index: number;
  key?: React.Key;
}>) {
  const isExpense = type === 'Expense';

  const getIcon = () => {
    const normalized = category.toLowerCase();

    if (normalized.includes('food')) return <ShoppingBasket size={20} />;
    if (normalized.includes('coffee')) return <Coffee size={20} />;
    if (normalized.includes('income') || normalized.includes('salary')) return <Banknote size={20} />;
    if (normalized.includes('transport')) return <TrendingUp size={20} />;
    return <Receipt size={20} />;
  };

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.04 + index * 0.03 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3.5 bg-white dark:bg-surface-dark p-3.5 rounded-2xl border border-border/40 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer shadow-sm"
    >
      <div
        className={`size-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isExpense ? 'bg-expense-bg/60 text-expense' : 'bg-income-bg/60 text-income'}`}
      >
        {getIcon()}
      </div>
      <div className="flex-1 flex justify-between items-center overflow-hidden">
        <div className="overflow-hidden">
          <p className="text-text-dark dark:text-slate-100 font-bold text-[14px] truncate">
            {merchant || category}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-semibold text-secondary">{category}</span>
            <span className="size-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
            <span className="text-[10px] font-semibold text-secondary opacity-60">{formatDateShort(date, 'th-TH')}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`${isExpense ? 'text-expense' : 'text-income'} font-bold text-[15px] tabular-nums`}
          >
            {isExpense ? '-' : '+'}
            {formatMoney(amount, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
