import React, { useMemo, useState } from 'react';
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

  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  const last7DaysData = useMemo(() => {
    const days = [];
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      days.push({
        date: d,
        label: d.toLocaleDateString(locale, { weekday: 'short' }),
        amount: 0,
      });
    }

    transactions.forEach((t) => {
      if (t.type === 'Expense') {
        const tDateStr = new Date(t.date).toDateString();
        const found = days.find((day) => day.date.toDateString() === tDateStr);
        if (found) {
          found.amount += t.amount;
        }
      }
    });

    return days;
  }, [transactions, locale]);

  const maxAmount = useMemo(() => {
    const max = Math.max(...last7DaysData.map((d) => d.amount));
    return max > 0 ? max : 100;
  }, [last7DaysData]);

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
          className="relative overflow-hidden bg-[#1E1E2F] text-white rounded-[24px] p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-white/5 ring-1 ring-white/5"
        >
          <svg
            className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
            viewBox="0 0 350 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M-20,100 C100,60 150,140 250,80 C350,20 400,80 450,40 L450,180 L-20,180 Z"
              fill="rgba(255,255,255,0.06)"
            />
            <path
              d="M-20,110 C80,80 180,120 280,60 C380,0 400,100 450,70 L450,180 L-20,180 Z"
              fill="rgba(255,255,255,0.04)"
            />
          </svg>

          <div className="flex justify-between items-start mb-1 relative z-10">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{t.balance}</p>
              <motion.h1
                key={balance}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[2.4rem] leading-none font-black text-white tabular-nums tracking-tighter"
              >
                {formatCurrency(balance)}
              </motion.h1>
            </div>
            <div className="size-11 rounded-[16px] bg-white/10 dark:bg-white/5 border border-white/10 dark:border-white/5 flex items-center justify-center text-white dark:text-white/60 shadow-inner">
              <Wallet size={22} strokeWidth={1.5} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="size-[34px] rounded-[12px] bg-white/10 dark:bg-white/5 flex items-center justify-center text-white/80 dark:text-white/80 border border-white/5 dark:border-white/5">
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">{t.income}</p>
                <p className="text-sm font-black text-white tabular-nums tracking-tight">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="size-[34px] rounded-[12px] bg-white/10 dark:bg-white/5 flex items-center justify-center text-white/80 dark:text-white/80 border border-white/5 dark:border-white/5">
                <ArrowDownRight size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">{t.expense}</p>
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

      {/* Analytics Chart Section */}
      <section className="px-4 pt-4 animate-slide-up">
        <div className="bg-white dark:bg-surface-dark border border-border/50 dark:border-white/5 rounded-[24px] p-5 shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">
                {currentLang === 'th' ? 'สถิติรายจ่าย 7 วันล่าสุด' : 'Last 7 Days Expenses'}
              </p>
              <h3 className="text-sm font-black text-text-dark dark:text-white tracking-tight leading-tight">
                {currentLang === 'th' ? 'การใช้จ่ายสะสม' : 'Weekly Expenses'}
              </h3>
            </div>
            {activeBarIndex !== null && last7DaysData[activeBarIndex].amount > 0 && (
              <div className="text-right">
                <span className="text-[9px] font-bold text-secondary uppercase tracking-widest block">
                  {last7DaysData[activeBarIndex].label}
                </span>
                <span className="text-xs font-black text-[#7A36FF] tabular-nums tracking-tight">
                  {formatCurrency(last7DaysData[activeBarIndex].amount, 2)}
                </span>
              </div>
            )}
          </div>

          {/* Bar Chart Bars */}
          <div className="flex justify-between items-end h-28 pt-6 px-2 relative">
            {last7DaysData.map((d, index) => {
              const heightPct = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
              const isActive = activeBarIndex === index;

              return (
                <div
                  key={index}
                  className="flex flex-col items-center flex-1 group cursor-pointer relative"
                  onMouseEnter={() => setActiveBarIndex(index)}
                  onMouseLeave={() => setActiveBarIndex(null)}
                  onClick={() => setActiveBarIndex(isActive ? null : index)}
                >
                  {/* Tooltip absolutely positioned overlaying the bar */}
                  {isActive && d.amount > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black py-1 px-1.5 rounded-[6px] whitespace-nowrap shadow-md z-20 transition-all pointer-events-none">
                      {formatCurrency(d.amount)}
                    </div>
                  )}

                  {/* Vertical Bar */}
                  <div className="w-full h-20 flex items-end justify-center relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPct, 6)}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                      className={`w-3.5 rounded-full transition-colors duration-200 ${
                        isActive ? 'bg-[#7A36FF]' : 'bg-[#E5E7EB] dark:bg-white/10'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[9px] mt-2 font-bold uppercase tracking-wider ${
                      isActive ? 'text-[#7A36FF]' : 'text-secondary/60'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
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
