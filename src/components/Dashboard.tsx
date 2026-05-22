import React, { useMemo, useState, useEffect } from 'react';
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
  Bell,
  Scan,
  CreditCard,
  Banknote,
  PieChart,
  Eye,
  EyeOff,
  Smartphone,
  ArrowLeftRight,
} from 'lucide-react';
import { ViewState, Transaction, TransactionType } from '../App';
import { motion } from 'motion/react';
import { formatDateShort, formatMoney, getUserLocale, getCurrencySymbol } from '../lib/formatters';
import { getTranslation } from '../lib/i18n';
import { getDateRangeBoundaries } from '../lib/dateUtils';
import { LocalCategory, getLocalBudgets, type LocalBudget } from '../lib/supabase';
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

  const [budgets, setBudgets] = useState<LocalBudget[]>([]);
  const [showBalance, setShowBalance] = useState<boolean>(() => {
    try {
      return globalThis.localStorage.getItem('joddi_show_balance') !== 'false';
    } catch {
      return true;
    }
  });

  // Load budgets on mount and listen to changes
  useEffect(() => {
    const load = async () => {
      try {
        setBudgets(await getLocalBudgets());
      } catch (error) {
        console.error('Failed to load budgets', error);
      }
    };
    load();
    globalThis.addEventListener('joddi:budgets-changed', load);
    return () => {
      globalThis.removeEventListener('joddi:budgets-changed', load);
    };
  }, []);

  const handleToggleBalance = () => {
    setShowBalance((prev) => {
      const next = !prev;
      try {
        globalThis.localStorage.setItem('joddi_show_balance', String(next));
      } catch {
        // Ignore storage write issues
      }
      return next;
    });
  };

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
      } else if (transaction.type === 'Expense') {
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

  // Compute balance for each payment method
  const methodBalances = useMemo(() => {
    const balances: Record<string, number> = {
      cash: 0,
      bank: 0,
      card: 0,
      ewallet: 0,
      promptpay: 0,
    };

    transactions.forEach((tx) => {
      const method = tx.paymentMethod || 'cash';
      const key = balances[method] !== undefined ? method : 'cash';
      if (tx.type === 'Income') {
        balances[key] += tx.amount;
      } else if (tx.type === 'Expense') {
        balances[key] -= tx.amount;
      } else if (tx.type === 'Transfer') {
        balances[key] -= tx.amount;
        const toMethod = tx.toPaymentMethod || 'cash';
        const toKey = balances[toMethod] !== undefined ? toMethod : 'cash';
        balances[toKey] += tx.amount;
      }
    });

    return balances;
  }, [transactions]);

  // Compute normalized monthly budget limit
  const budgetData = useMemo(() => {
    let totalLimit = 0;
    budgets.forEach((b) => {
      let monthlyLimit = b.limit;
      if (b.period === 'daily') {
        monthlyLimit = b.limit * 30;
      } else if (b.period === 'weekly') {
        monthlyLimit = b.limit * 4.33;
      } else if (b.period === 'yearly') {
        monthlyLimit = b.limit / 12;
      }
      totalLimit += monthlyLimit;
    });
    return {
      totalLimit,
      spent: monthExpense,
    };
  }, [budgets, monthExpense]);

  const budgetRangeText = useMemo(() => {
    const boundaries = getDateRangeBoundaries();
    const start = new Date(boundaries.monthStart);
    const end = new Date();
    const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    const fmt = (d: Date) => d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
    return `${fmt(start)} - ${fmt(lastDay)}`;
  }, [locale]);

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

  const CARDS_DATA = [
    {
      id: 'bank',
      labelTh: 'โอนธนาคาร',
      labelEn: 'Bank Account',
      icon: <Landmark size={20} className="text-white" />,
      gradient: 'from-[#7A36FF] to-[#9B66FF]',
    },
    {
      id: 'card',
      labelTh: 'บัตรเครดิต',
      labelEn: 'Credit Card',
      icon: <CreditCard size={20} className="text-white" />,
      gradient: 'from-[#1E1E2F] to-[#3F3F5F]',
    },
    {
      id: 'ewallet',
      labelTh: 'วอลเล็ต',
      labelEn: 'E-Wallet',
      icon: <Wallet size={20} className="text-white" />,
      gradient: 'from-[#06B6D4] to-[#3B82F6]',
    },
    {
      id: 'cash',
      labelTh: 'เงินสด',
      labelEn: 'Cash Wallet',
      icon: <Banknote size={20} className="text-white" />,
      gradient: 'from-[#10B981] to-[#34D399]',
    },
    {
      id: 'promptpay',
      labelTh: 'พร้อมเพย์',
      labelEn: 'PromptPay',
      icon: <Smartphone size={20} className="text-white" />,
      gradient: 'from-[#004A7F] to-[#00A3FF]',
    },
  ];

  return (
    <div className="flex flex-col min-h-full pb-32 relative bg-background-light dark:bg-[#09090B]">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 pb-4 sticky top-0 z-30 bg-background-light/80 dark:bg-[#09090B]/80 backdrop-blur-xl border-b border-transparent dark:border-white/5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="size-11 shrink-0 rounded-2xl bg-slate-100 dark:bg-white/5 border border-border/40 dark:border-white/10 flex items-center justify-center font-black text-sm uppercase shadow-inner">
            <User size={22} className="text-secondary dark:text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-text-dark dark:text-slate-100 text-base font-black tracking-tight leading-tight">
              {userName || (currentLang === 'th' ? 'จดดี' : 'Joddi')}
            </h2>
            <p className="text-secondary text-[10px] font-bold opacity-60 uppercase tracking-widest">
              {currentLang === 'th' ? 'สวัสดีตอนบ่าย' : 'Good Afternoon'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button
            aria-label="Search"
            whileTap={{ scale: 0.9 }}
            className="flex items-center justify-center rounded-2xl h-11 w-11 bg-white dark:bg-white/5 text-secondary border border-border/40 dark:border-white/10 shadow-sm"
          >
            <Scan size={20} strokeWidth={1.5} />
          </motion.button>
          <motion.button
            aria-label="Settings"
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('settings')}
            className="flex items-center justify-center rounded-2xl h-11 w-11 bg-white dark:bg-white/5 text-secondary border border-border/40 dark:border-white/10 shadow-sm"
          >
            <Settings size={20} strokeWidth={1.5} />
          </motion.button>
        </div>
      </header>

      {readOnlyMode && (
        <section className="px-6 pt-2">
          <div className="rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200 text-[10px] font-black tracking-[0.1em] uppercase px-4 py-2 text-center ring-1 ring-amber-500/20">
            ReadOnly Mode
          </div>
        </section>
      )}

      {/* Main Balance Display */}
      <section className="px-6 pt-8 pb-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-secondary text-[11px] font-black uppercase tracking-[0.3em] mb-3 opacity-60">
          <span>{currentLang === 'th' ? 'ยอดคงเหลือทั้งหมด' : 'Total Balance'}</span>
          <button onClick={handleToggleBalance} className="hover:text-primary transition-colors">
            {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-black text-slate-400 tracking-tighter">{getCurrencySymbol(locale, currency)}</span>
          <h1 className="text-[4rem] font-black text-text-dark dark:text-white tabular-nums tracking-tighter leading-none">
            {showBalance ? formatMoney(balance, { compact: false, currency: '' }).split('.')[0] : '••••'}
          </h1>
          <span className="text-3xl font-black text-slate-400 tabular-nums">
            .{showBalance ? formatMoney(balance, { compact: false, currency: '' }).split('.')[1] || '00' : '••'}
          </span>
        </div>
      </section>

      {/* Primary Actions Grid */}
      <section className="px-6 pt-6 grid grid-cols-4 gap-4">
        <ActionButton
          icon={<Plus size={22} />}
          label={currentLang === 'th' ? 'เพิ่ม' : 'Add'}
          onClick={() => openQuickAdd('Expense')}
          primary
        />
        <ActionButton
          icon={<Scan size={22} />}
          label={currentLang === 'th' ? 'สแกน' : 'Scan'}
          onClick={() => onNavigate('review_receipt')}
        />
        <ActionButton
          icon={<ArrowLeftRight size={22} />}
          label={currentLang === 'th' ? 'โอน' : 'Trans'}
          onClick={() => openQuickAdd('Transfer')}
        />
        <ActionButton
          icon={<PieChart size={22} />}
          label={currentLang === 'th' ? 'วิเคราะห์' : 'Report'}
          onClick={() => onNavigate('analytics')}
        />
      </section>

      {/* My Cards / Wallets Horizontal List */}
      <section className="pt-10">
        <div className="flex justify-between items-center px-6 mb-5">
          <h3 className="text-[11px] font-black text-text-dark dark:text-white uppercase tracking-[0.25em]">
            {currentLang === 'th' ? 'กระเป๋าเงิน' : 'My Assets'}
          </h3>
          <button
            onClick={() => onNavigate('settings')}
            className="text-[10px] font-black text-primary dark:text-primary-dark uppercase tracking-widest"
          >
            Manage
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 py-2 snap-x snap-mandatory">
          {CARDS_DATA.map((card) => {
            const cardBalance = methodBalances[card.id] || 0;
            return (
              <motion.div
                key={card.id}
                whileTap={{ scale: 0.97 }}
                className={`snap-center flex-shrink-0 w-[280px] rounded-[36px] p-6 text-white bg-gradient-to-br ${card.gradient} shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] relative overflow-hidden flex flex-col justify-between aspect-[1.6/1]`}
              >
                {/* Decorative Premium Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 size-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex justify-between items-start z-10">
                  <div className="size-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                    {card.icon}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 pt-1">
                    {currentLang === 'th' ? card.labelTh : card.labelEn}
                  </p>
                </div>

                <div className="z-10 mt-auto">
                  <p className="text-3xl font-black tabular-nums tracking-tighter mb-1">
                    {showBalance ? formatCurrency(cardBalance) : '••••••'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-white/40 animate-pulse" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-60">
                      {currentLang === 'th' ? 'ยอดที่ใช้ได้' : 'Available Balance'}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Budget Overview Row */}
      <section className="px-6 pt-10">
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('budget')}
          className="bg-white dark:bg-white/2 border border-border/40 dark:border-white/5 rounded-[32px] p-6 shadow-sm flex flex-col gap-5 cursor-pointer group"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary-dark shadow-inner">
                <PieChart size={20} strokeWidth={2.5} />
              </div>
              <h4 className="text-[11px] font-black text-text-dark dark:text-white uppercase tracking-[0.2em]">
                {currentLang === 'th' ? 'งบประมาณรายเดือน' : 'Monthly Budget'}
              </h4>
            </div>
            <span className="text-[10px] font-black text-secondary/50 uppercase tracking-widest">
              {budgetRangeText}
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">Remaining</p>
              <p className="text-2xl font-black text-text-dark dark:text-white tabular-nums tracking-tighter">
                {formatCurrency(Math.max(budgetData.totalLimit - budgetData.spent, 0))}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">Total Limit</p>
              <p className="text-lg font-black text-secondary tabular-nums tracking-tighter">
                {formatCurrency(budgetData.totalLimit)}
              </p>
            </div>
          </div>

          {/* Liquid Progress Bar */}
          <div className="relative h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-border/20 dark:border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((budgetData.spent / budgetData.totalLimit) * 100, 100)}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-primary shadow-[0_0_12px_rgba(122,54,255,0.4)] rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Transaction Feed */}
      <section className="flex flex-col px-6 mt-10">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-[11px] font-black text-text-dark dark:text-white uppercase tracking-[0.25em]">
            {currentLang === 'th' ? 'รายการล่าสุด' : 'Recent Activity'}
          </h3>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1 text-primary dark:text-primary-dark text-[10px] font-black uppercase tracking-widest"
          >
            See All
            <ChevronRight size={12} strokeWidth={3} />
          </motion.button>
        </div>

        <div className="space-y-3.5 pb-10">
          {recentTransactions.length === 0 ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 bg-white dark:bg-white/2 rounded-[32px] border border-dashed border-border/40 dark:border-white/5"
            >
              <Receipt size={32} strokeWidth={1} className="text-slate-300 dark:text-white/20 mb-4" />
              <p className="text-secondary text-[10px] font-black uppercase tracking-[0.2em] opacity-50">No Activity</p>
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
                paymentMethod={transaction.paymentMethod}
                toPaymentMethod={transaction.toPaymentMethod}
                categories={categories}
                onClick={(id) => onNavigate('transaction_detail', id)}
                currentLang={currentLang}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  primary = false,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}>) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 flex-1 group"
    >
      <div
        className={`size-14 rounded-[20px] flex items-center justify-center transition-all shadow-sm ${
          primary
            ? 'bg-primary text-white shadow-[0_8px_20px_-4px_rgba(122,54,255,0.4)]'
            : 'bg-white dark:bg-white/5 text-secondary dark:text-white border border-border/40 dark:border-white/10 group-hover:border-primary/40'
        }`}
      >
        {React.cloneElement(icon as React.ReactElement, { strokeWidth: primary ? 2.5 : 1.5 })}
      </div>
      <span className="text-[10px] font-black text-secondary dark:text-white/60 uppercase tracking-widest">
        {label}
      </span>
    </motion.button>
  );
}

const METHOD_LABELS: Record<string, { th: string; en: string }> = {
  cash: { th: 'เงินสด', en: 'Cash' },
  bank: { th: 'โอนธนาคาร', en: 'Bank Transfer' },
  card: { th: 'บัตรเครดิต', en: 'Credit Card' },
  ewallet: { th: 'วอลเล็ต', en: 'E-Wallet' },
  promptpay: { th: 'พร้อมเพย์', en: 'PromptPay' },
};

function TransactionItem({
  id,
  type,
  category: categoryName,
  merchant,
  date,
  amount,
  paymentMethod,
  toPaymentMethod,
  index,
  categories = [],
  onClick,
  currentLang,
}: Readonly<{
  id: string;
  type: TransactionType;
  category: string;
  merchant?: string;
  date: string;
  amount: number;
  paymentMethod?: string;
  toPaymentMethod?: string;
  index: number;
  categories?: LocalCategory[];
  onClick?: (id: string) => void;
  currentLang: 'th' | 'en';
  key?: React.Key;
}>) {
  const isExpense = type === 'Expense';
  const isTransfer = type === 'Transfer';
  const categoryObj = categories.find((c) => c.name === categoryName);

  let iconNode = (categoryObj && ICONS[categoryObj.iconName]) || <Receipt size={20} />;
  let colorStyles: { style: React.CSSProperties; className: string } = categoryObj
    ? getCategoryColorStyles(categoryObj.color)
    : { style: {}, className: 'text-white/60' };

  if (isTransfer) {
    iconNode = <ArrowLeftRight size={20} />;
    colorStyles = {
      style: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
      className: 'text-blue-500',
    };
  }

  const getMethodLabel = (method?: string) => {
    if (!method) return '';
    return METHOD_LABELS[method]?.[currentLang] || method;
  };

  const displayName = isTransfer
    ? `${getMethodLabel(paymentMethod)} → ${getMethodLabel(toPaymentMethod)}`
    : merchant || categoryName;

  const displayCategory = isTransfer ? (currentLang === 'en' ? 'Transfer' : 'โอนเงิน') : categoryName;

  const fallbackClass = isTransfer
    ? 'bg-blue-500/10 text-blue-500'
    : isExpense
      ? 'bg-expense-bg text-expense'
      : 'bg-income-bg text-income';

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.04 + index * 0.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(id)}
      className="flex items-center gap-4 bg-white dark:bg-[#121214] p-4 rounded-[28px] border border-border/40 dark:border-white/5 hover:bg-background-light dark:hover:bg-white/5 transition-all group cursor-pointer shadow-sm"
    >
      <div
        className="size-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border border-transparent dark:border-white/5 shadow-inner"
        style={colorStyles.style}
      >
        <span className={colorStyles.className}>
          {React.cloneElement(iconNode as React.ReactElement, { size: 22, strokeWidth: 1.5 })}
        </span>
      </div>
      <div className="flex-1 flex justify-between items-center overflow-hidden">
        <div className="overflow-hidden">
          <p className="text-text-dark dark:text-white font-black text-[14px] truncate tracking-tight mb-0.5">
            {displayName}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-secondary uppercase tracking-[0.1em] opacity-80">
              {displayCategory}
            </span>
            <span className="size-1 bg-slate-200 dark:bg-white/10 rounded-full"></span>
            <span className="text-[9px] font-bold text-secondary opacity-50 uppercase tracking-widest">
              {formatDateShort(date, currentLang === 'th' ? 'th-TH' : 'en-US')}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`${
              isTransfer
                ? 'text-primary dark:text-primary-dark'
                : isExpense
                  ? 'text-text-dark dark:text-white'
                  : 'text-emerald-500'
            } font-black text-[15px] tabular-nums tracking-tighter`}
          >
            {isTransfer ? '' : isExpense ? '-' : '+'}
            {formatMoney(amount, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
