import React, { useMemo } from 'react';
import {
  User,
  Wallet,
  TrendingUp,
  TrendingDown,
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
import { formatDateShort, formatMoney, getUserLocale } from '../lib/formatters';
import { getTranslation } from '../lib/i18n';
import { getDateRangeBoundaries } from '../lib/dateUtils';
import { LocalCategory } from '../lib/supabase';
import { ICONS, getCategoryColorStyles } from '../lib/categoryUtils';
import { AiInsightCard } from './AiInsightCard';
import { getLocalAiInsight } from '../lib/aiInsights';

const QUICK_ADD_TYPE_KEY = 'quick_add_type';

export function Dashboard({
  onNavigate,
  onAddTransaction,
  transactions,
  categories,
  userName,
  lang,
  currency,
  canCreateTransactions = true,
  readOnlyMode = false,
}: Readonly<{
  onNavigate: (v: ViewState, payload?: any) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void | Promise<void>;
  transactions: Transaction[];
  categories?: LocalCategory[];
  userName?: string;
  lang?: 'th' | 'en';
  currency?: string;
  canCreateTransactions?: boolean;
  readOnlyMode?: boolean;
}>) {
  const currentLang = lang || 'th';
  const t = getTranslation(currentLang);
  const locale = getUserLocale();
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
    const boundaries = getDateRangeBoundaries();

    const monthCategoryExpenseMap: Record<string, number> = {};
    let todayIncomeValue = 0;
    let todayExpenseValue = 0;
    let totalIncomeValue = 0;
    let totalExpenseValue = 0;
    let monthIncomeValue = 0;
    let monthExpenseValue = 0;

    transactions.forEach((transaction) => {
      const tTime = new Date(transaction.date).getTime();
      const isCurrentMonth = tTime >= boundaries.monthStart;
      const isToday = tTime >= boundaries.todayStart;

      if (transaction.type === 'Income') {
        totalIncomeValue += transaction.amount;
        if (isToday) todayIncomeValue += transaction.amount;
        if (isCurrentMonth) monthIncomeValue += transaction.amount;
      } else {
        totalExpenseValue += transaction.amount;
        if (isToday) todayExpenseValue += transaction.amount;
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
      currency,
      locale,
    });

  const aiInsight = useMemo(() => getLocalAiInsight(transactions), [transactions]);

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
        className="flex items-center bg-white dark:bg-surface-dark px-5 pb-3 justify-between sticky top-0 z-20 border-b border-border/50 dark:border-white/5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/10 bg-primary/5 flex items-center justify-center">
            <User className="text-primary" size={20} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">
              {new Date().toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <h2 className="text-text-dark dark:text-slate-100 text-base font-black tracking-tight leading-tight">
              {userName || (currentLang === 'th' ? 'จดดี' : 'Joddi')}
            </h2>
          </div>
        </div>
        <motion.button
          aria-label="Settings"
          whileTap={{ scale: 0.9 }}
          onClick={() => onNavigate('settings')}
          className="flex items-center justify-center rounded-full h-10 w-10 bg-input-bg dark:bg-white/5 text-secondary hover:text-primary transition-colors border border-transparent dark:border-white/5"
        >
          <Settings size={20} strokeWidth={1.5} />
        </motion.button>
      </header>

      {readOnlyMode && (
        <section className="px-4 pt-3">
          <div className="rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200 text-[11px] font-black tracking-[0.1em] uppercase px-4 py-2.5 text-center ring-1 ring-amber-500/20">
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
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 dark:from-black dark:via-black dark:to-black text-white rounded-3xl p-6 shadow-lg shadow-indigo-500/5 dark:shadow-none border border-white/10 dark:border-white/10 ring-1 ring-white/5"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-blue-500/5 dark:bg-white/2 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-between items-start mb-1 relative z-10">
            <div>
              <p className="text-blue-100 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">
                {t.balance}
              </p>
              <motion.h1
                key={balance}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[2.4rem] leading-none font-black text-white tabular-nums tracking-tighter"
              >
                {formatCurrency(balance)}
              </motion.h1>
            </div>
            <div className="size-11 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/10 dark:border-white/5 flex items-center justify-center text-white dark:text-white/60 shadow-inner">
              <Wallet size={22} strokeWidth={1.5} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="size-[34px] rounded-xl bg-white/10 dark:bg-white/5 flex items-center justify-center text-white/80 dark:text-white/80 border border-white/5 dark:border-white/5">
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-blue-100 dark:text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">
                  {t.income}
                </p>
                <p className="text-sm font-black text-white tabular-nums tracking-tight">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="size-[34px] rounded-xl bg-white/10 dark:bg-white/5 flex items-center justify-center text-white/80 dark:text-white/80 border border-white/5 dark:border-white/5">
                <ArrowDownRight size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-blue-100 dark:text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">
                  {t.expense}
                </p>
                <p className="text-sm font-black text-white tabular-nums tracking-tight">
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
          className="bg-white dark:bg-surface-dark border border-border/50 dark:border-white/5 p-4 rounded-2xl shadow-sm hover:ring-1 ring-primary/20 transition-all flex items-center gap-3.5"
        >
          <div className="size-10 rounded-xl bg-emerald-50 dark:bg-white/5 flex items-center justify-center text-emerald-600 dark:text-emerald-500 border border-emerald-100/50 dark:border-white/5">
            <TrendingUp size={18} strokeWidth={2} />
          </div>
          <div>
            <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">รับวันนี้</p>
            <p className="text-base font-black text-text-dark dark:text-white tabular-nums tracking-tight">
              {formatCurrency(todayIncome, 2)}
            </p>
          </div>
        </motion.div>
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-surface-dark border border-border/50 dark:border-white/5 p-4 rounded-2xl shadow-sm hover:ring-1 ring-primary/20 transition-all flex items-center gap-3.5"
        >
          <div className="size-10 rounded-xl bg-rose-50 dark:bg-white/5 flex items-center justify-center text-rose-600 dark:text-rose-500 border border-rose-100/50 dark:border-white/5">
            <TrendingDown size={18} strokeWidth={2} />
          </div>
          <div>
            <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">จ่ายวันนี้</p>
            <p className="text-base font-black text-text-dark dark:text-white tabular-nums tracking-tight">
              {formatCurrency(todayExpense, 2)}
            </p>
          </div>
        </motion.div>
      </section>

      {/* AI Insight Card */}
      <AiInsightCard insight={aiInsight} onNavigate={onNavigate} />

      {/* Quick Actions — semantic colors for clarity */}
      <section className="px-4 pt-4 grid grid-cols-4 gap-2.5">
        <QuickActionCard
          icon={<Plus size={20} />}
          label="จ่าย"
          onClick={() => openQuickAdd('Expense')}
          disabled={!canCreateTransactions}
          colorClass="bg-expense/5 text-expense border-expense/10"
        />
        <QuickActionCard
          icon={<TrendingUp size={20} />}
          label="รายรับ"
          onClick={() => openQuickAdd('Income')}
          disabled={!canCreateTransactions}
          colorClass="bg-income/5 text-income border-income/10"
        />
        <QuickActionCard
          icon={<Receipt size={20} />}
          label="สลิป"
          onClick={() => onNavigate('review_receipt')}
          disabled={!canCreateTransactions}
          colorClass="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-border/40 dark:border-white/5"
        />
        <QuickActionCard
          icon={<Landmark size={20} />}
          label="งบประมาณ"
          onClick={() => onNavigate('budget')}
          colorClass="bg-primary/5 text-primary border-primary/10"
        />
      </section>

      {/* Monthly Budget Summary — compact */}
      <section className="px-4 pt-4">
        <div className="bg-white dark:bg-surface-dark border border-border/60 dark:border-white/5 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-0.5">Budget Status</p>
              <h3 className="text-lg font-black text-text-dark dark:text-white tabular-nums tracking-tighter">
                {formatCurrency(monthNet)}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('budget')}
              className="rounded-xl bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 px-3 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-transparent dark:border-white/5"
            >
              Manage
            </button>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border/40 dark:border-white/5">
            <MetricRow label="รายรับ" value={formatCurrency(monthIncome)} positive />
            <MetricRow label="รายจ่าย" value={formatCurrency(monthExpense)} />
            <MetricRow label="ใช้เทียบรายรับ" value={`${monthSpendRate.toFixed(0)}%`} warning={monthSpendRate > 80} />
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="flex flex-col px-4 mt-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[10px] font-black text-text-dark dark:text-white uppercase tracking-[0.2em]">
            Latest Entries
          </h3>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1 text-primary text-[10px] font-black uppercase tracking-[0.1em] transition-all"
          >
            {currentLang === 'th' ? 'ดูทั้งหมด' : 'View All'}
            <ChevronRight size={14} />
          </motion.button>
        </div>

        <div className="space-y-2 pb-4">
          {recentTransactions.length === 0 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 bg-white dark:bg-white/2 rounded-3xl border border-dashed border-border dark:border-white/5"
            >
              <div className="size-14 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-white/60 border border-transparent dark:border-white/5">
                <Receipt size={28} strokeWidth={1} />
              </div>
              <p className="text-secondary text-[11px] font-black uppercase tracking-[0.2em]">No entries yet</p>
              <button
                disabled={!canCreateTransactions}
                onClick={() => onNavigate('add_transaction')}
                className={`mt-4 text-[10px] font-black uppercase tracking-widest ${canCreateTransactions ? 'text-primary' : 'text-secondary opacity-60 cursor-not-allowed'}`}
              >
                {canCreateTransactions ? 'Add First Transaction' : 'Login to Start'}
              </button>
            </motion.div>
          ) : (
            recentTransactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                id={transaction.id}
                index={index}
                type={transaction.type}
                category={transaction.category}
                merchant={transaction.merchant}
                date={transaction.date}
                amount={transaction.amount}
                categories={categories}
                onClick={(id) => onNavigate('transaction_detail', id)}
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
    : 'bg-white dark:bg-white/2 border border-border/60 dark:border-white/5 text-text-dark dark:text-white shadow-sm';

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl py-4 px-2 flex flex-col items-center justify-center gap-1.5 min-h-[80px] transition-all ${baseClasses} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <span>{React.cloneElement(icon as React.ReactElement, { strokeWidth: 1.5 })}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.1em] leading-none">{label}</span>
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
    <div className="flex items-center justify-between text-[11px] gap-3 py-1">
      <span className="text-secondary font-bold uppercase tracking-[0.05em]">{label}</span>
      <span className={`font-black tabular-nums tracking-tight ${textStyle}`}>{value}</span>
    </div>
  );
}

function TransactionItem({
  id,
  type,
  category: categoryName,
  merchant,
  date,
  amount,
  index,
  categories = [],
  onClick,
}: Readonly<{
  id: string;
  type: TransactionType;
  category: string;
  merchant?: string;
  date: string;
  amount: number;
  index: number;
  categories?: LocalCategory[];
  onClick?: (id: string) => void;
  key?: React.Key;
}>) {
  const isExpense = type === 'Expense';
  const categoryObj = categories.find((c) => c.name === categoryName);
  const iconNode = (categoryObj && ICONS[categoryObj.iconName]) || <Receipt size={20} />;
  const colorStyles = categoryObj
    ? getCategoryColorStyles(categoryObj.color)
    : { style: {}, className: 'text-white/60' };

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.04 + index * 0.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(id)}
      className="flex items-center gap-3.5 bg-white dark:bg-white/2 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group cursor-pointer"
    >
      <div
        className="size-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 bg-slate-50 dark:bg-white/10 border border-transparent dark:border-white/5"
        style={colorStyles.style}
      >
        <span className={colorStyles.className}>
          {React.cloneElement(iconNode as React.ReactElement, { size: 20, strokeWidth: 1.5 })}
        </span>
      </div>
      <div className="flex-1 flex justify-between items-center overflow-hidden">
        <div className="overflow-hidden">
          <p className="text-text-dark dark:text-slate-100 font-black text-[14px] truncate tracking-tight">
            {merchant || categoryName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] font-black text-secondary uppercase tracking-widest">{categoryName}</span>
            <span className="size-0.5 bg-slate-200 dark:bg-white/10 rounded-full"></span>
            <span className="text-[9px] font-bold text-secondary opacity-60 uppercase tracking-wider">
              {formatDateShort(date, 'th-TH')}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`${isExpense ? 'text-text-dark dark:text-white' : 'text-emerald-500'} font-black text-[15px] tabular-nums tracking-tighter`}
          >
            {isExpense ? '-' : '+'}
            {formatMoney(amount, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
