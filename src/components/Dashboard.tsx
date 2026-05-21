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
import { formatDateShort, formatMoney, getUserLocale } from '../lib/formatters';
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
      gradient: 'from-[#7A36FF] to-[#4F46E5]',
      brand: 'BANKING',
      number: '•••• •••• •••• 4234',
      holder: userName || 'User Account',
    },
    {
      id: 'card',
      labelTh: 'บัตรเครดิต',
      labelEn: 'Credit Card',
      icon: <CreditCard size={20} className="text-white" />,
      gradient: 'from-[#1E1E2F] to-[#3B3B54]',
      brand: 'VISA',
      number: '•••• •••• •••• 9261',
      holder: userName || 'User Card',
    },
    {
      id: 'ewallet',
      labelTh: 'วอลเล็ต',
      labelEn: 'E-Wallet',
      icon: <Wallet size={20} className="text-white" />,
      gradient: 'from-[#06B6D4] to-[#0891B2]',
      brand: 'WALLET',
      number: '•••• •••• •••• 1093',
      holder: userName || 'E-Wallet Wallet',
    },
    {
      id: 'cash',
      labelTh: 'เงินสด',
      labelEn: 'Cash Wallet',
      icon: <Banknote size={20} className="text-white" />,
      gradient: 'from-[#10B981] to-[#059669]',
      brand: 'CASH',
      number: '•••• •••• •••• 5678',
      holder: userName || 'Cash Balance',
    },
    {
      id: 'promptpay',
      labelTh: 'พร้อมเพย์',
      labelEn: 'PromptPay',
      icon: <Smartphone size={20} className="text-white" />,
      gradient: 'from-[#004A7F] to-[#007FAD]',
      brand: 'PROMPTPAY',
      number: '•••• •••• •••• 0098',
      holder: userName || 'PromptPay',
    },
  ];

  return (
    <div className="flex flex-col min-h-full pb-32 relative bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 pb-3 sticky top-0 z-20 bg-background-light/85 dark:bg-background-dark/85 backdrop-blur-md border-b border-border/10 dark:border-white/5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 rounded-full bg-[#0F0F15] dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-sm uppercase ring-2 ring-primary/10 shadow-sm">
            {userName ? userName.charAt(0) : 'J'}
          </div>
          <div>
            <h2 className="text-text-dark dark:text-slate-100 text-sm font-black tracking-tight leading-tight">
              Hi, {userName || (currentLang === 'th' ? 'จดดี' : 'Joddi')}
            </h2>
            <p className="text-secondary text-[10px] font-bold opacity-60 uppercase tracking-wider">
              {currentLang === 'th' ? 'ยินดีต้อนรับกลับมา!' : 'Welcome back!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <motion.button
            aria-label="Notifications"
            whileTap={{ scale: 0.9 }}
            className="relative flex items-center justify-center rounded-full h-10 w-10 bg-white dark:bg-white/5 text-secondary hover:text-primary transition-colors border border-border/40 dark:border-white/5 shadow-sm"
          >
            <Bell size={20} strokeWidth={1.5} />
            <span className="absolute top-2.5 right-2.5 size-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-background-dark" />
          </motion.button>

          {/* Settings */}
          <motion.button
            aria-label="Settings"
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('settings')}
            className="flex items-center justify-center rounded-full h-10 w-10 bg-white dark:bg-white/5 text-secondary hover:text-primary transition-colors border border-border/40 dark:border-white/5 shadow-sm"
          >
            <Settings size={20} strokeWidth={1.5} />
          </motion.button>
        </div>
      </header>

      {readOnlyMode && (
        <section className="px-5 pt-3">
          <div className="rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200 text-[11px] font-black tracking-[0.1em] uppercase px-4 py-2.5 text-center ring-1 ring-amber-500/20">
            โหมดทดลองอ่านอย่างเดียว: เข้าสู่ระบบก่อนเพิ่มหรือแก้ไขข้อมูล
          </div>
        </section>
      )}

      {/* Total Balance Card */}
      <section className="px-5 pt-5">
        <div className="bg-[#1E1E2F] text-white rounded-[24px] p-6 shadow-[0_10px_30px_rgba(30,30,47,0.15)] relative overflow-hidden flex flex-col justify-between aspect-[2.1/1]">
          {/* SVG Wave Overlay */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,45 Q25,85 50,45 T100,45 L100,100 L0,100 Z" fill="url(#wave-gradient)" />
              <defs>
                <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7A36FF" />
                  <stop offset="100%" stopColor="#FF6A39" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2 text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                <span>{currentLang === 'th' ? 'ยอดคงเหลือทั้งหมด' : 'Total Balance'}</span>
                <button
                  onClick={handleToggleBalance}
                  className="text-white/40 hover:text-white p-0.5 rounded transition-colors"
                >
                  {showBalance ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
              </div>
              <h1 className="text-[2.2rem] font-black text-white tabular-nums tracking-tighter leading-none mt-1">
                {showBalance ? formatCurrency(balance, 2) : '••••••'}
              </h1>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
              <Wallet size={18} className="text-white" />
            </div>
          </div>

          <div className="flex gap-2.5 mt-5 z-10">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => openQuickAdd('Expense')}
              disabled={!canCreateTransactions}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-[#1E1E2F] font-black text-[11px] uppercase tracking-wider shadow-sm hover:bg-white/95 active:scale-95 transition-all disabled:opacity-50"
            >
              <Plus size={14} strokeWidth={3} />
              <span>{currentLang === 'th' ? 'เพิ่มรายการ' : 'Add Entry'}</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('review_receipt')}
              disabled={!canCreateTransactions}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 font-black text-[11px] uppercase tracking-wider shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              <Scan size={14} strokeWidth={2.5} />
              <span>{currentLang === 'th' ? 'สแกนสลิป' : 'Scan Slip'}</span>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Wallets Row */}
      <section className="pt-6">
        <div className="flex justify-between items-center px-5 mb-3.5">
          <h3 className="text-[11px] font-black text-text-dark dark:text-white uppercase tracking-[0.2em]">
            {currentLang === 'th' ? 'กระเป๋าเงิน' : 'My Wallets'}
          </h3>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar px-5 py-1.5 scroll-smooth snap-x snap-mandatory">
          {CARDS_DATA.map((card) => {
            const cardBalance = methodBalances[card.id] || 0;
            return (
              <motion.div
                key={card.id}
                whileTap={{ scale: 0.98 }}
                className={`snap-center flex-shrink-0 w-64 rounded-3xl p-5 text-white bg-gradient-to-br ${card.gradient} shadow-[0_8px_20px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col justify-between aspect-[1.58/1]`}
              >
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                    <circle cx="90" cy="10" r="40" fill="white" />
                    <circle cx="10" cy="90" r="30" fill="white" />
                  </svg>
                </div>

                <div className="flex justify-between items-start z-10">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] opacity-70">
                      {currentLang === 'th' ? card.labelTh : card.labelEn}
                    </p>
                    <p className="text-2xl font-black tabular-nums tracking-tighter mt-1">
                      {showBalance ? formatCurrency(cardBalance) : '••••••'}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">{card.icon}</div>
                </div>

                <div className="z-10 mt-4">
                  <p className="text-[10px] font-mono tracking-widest opacity-80 mb-2">{card.number}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-black uppercase tracking-wider opacity-70 truncate max-w-[120px]">
                      {card.holder}
                    </p>
                    <span className="text-[10px] font-black italic tracking-widest">{card.brand}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Today Income & Expense Summary */}
      <section className="px-5 pt-5 grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-white/2 border border-border/40 dark:border-white/5 p-4 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
          <div className="size-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-center text-emerald-500 shrink-0 border border-transparent dark:border-emerald-500/10">
            <ArrowUpRight size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-secondary text-[9px] font-black uppercase tracking-wider">
              {currentLang === 'th' ? 'รับวันนี้' : 'Today Income'}
            </p>
            <p className="text-base font-black text-text-dark dark:text-white tabular-nums tracking-tight mt-0.5">
              {formatCurrency(todayIncome, 2)}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-white/2 border border-border/40 dark:border-white/5 p-4 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex items-center gap-3.5">
          <div className="size-9 rounded-xl bg-rose-500/10 dark:bg-[#ff6a39]/5 flex items-center justify-center text-[#ff6a39] shrink-0 border border-transparent dark:border-expense/10">
            <ArrowDownRight size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-secondary text-[9px] font-black uppercase tracking-wider">
              {currentLang === 'th' ? 'จ่ายวันนี้' : 'Today Expense'}
            </p>
            <p className="text-base font-black text-text-dark dark:text-white tabular-nums tracking-tight mt-0.5">
              {formatCurrency(todayExpense, 2)}
            </p>
          </div>
        </div>
      </section>

      {/* Week/Monthly Budget Status Card */}
      <section className="px-5 pt-4">
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('budget')}
          className="bg-white dark:bg-white/2 border border-border/40 dark:border-white/5 rounded-3xl p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex items-center justify-between cursor-pointer hover:border-primary/20 dark:hover:border-white/10 transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-full bg-primary/10 dark:bg-white/5 flex items-center justify-center text-primary dark:text-[#9B66FF] shrink-0 border border-transparent dark:border-white/5">
              <PieChart size={20} strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-xs font-black text-text-dark dark:text-white uppercase tracking-wider">
                {currentLang === 'th' ? 'งบประมาณเดือนนี้' : 'This Month Budget'}
              </h4>
              <p className="text-[10px] font-bold text-secondary opacity-60 mt-0.5">{budgetRangeText}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-black text-text-dark dark:text-white tabular-nums tracking-tight">
              {formatCurrency(monthExpense)}
            </p>
            <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-0.5">
              {budgetData.totalLimit > 0
                ? `${currentLang === 'th' ? 'จาก' : 'of'} ${formatCurrency(budgetData.totalLimit)}`
                : currentLang === 'th'
                  ? 'ยังไม่ได้ตั้งค่า'
                  : 'No Limit'}
            </p>
          </div>
        </motion.div>
      </section>

      {/* Analytics Chart Section */}
      <section className="px-5 pt-5 animate-slide-up">
        <div className="bg-white dark:bg-white/2 border border-border/40 dark:border-white/5 rounded-[24px] p-5 shadow-[0_4px_15px_rgba(0,0,0,0.03)] transition-all">
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
                <span className="text-xs font-black text-[#7A36FF] dark:text-[#9B66FF] tabular-nums tracking-tight">
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
                  key={d.label + index}
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
                        isActive ? 'bg-[#7A36FF] dark:bg-[#9B66FF]' : 'bg-[#E5E7EB] dark:bg-white/10'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[9px] mt-2 font-bold uppercase tracking-wider ${
                      isActive ? 'text-[#7A36FF] dark:text-[#9B66FF]' : 'text-secondary/60'
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

      {/* Recent Transactions */}
      <section className="flex flex-col px-5 mt-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[11px] font-black text-text-dark dark:text-white uppercase tracking-[0.2em]">
            {currentLang === 'th' ? 'รายการล่าสุด' : 'Latest Entries'}
          </h3>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-1 text-primary dark:text-[#9B66FF] text-[10px] font-black uppercase tracking-[0.1em] transition-all"
          >
            {currentLang === 'th' ? 'ดูทั้งหมด' : 'View All'}
            <ChevronRight size={14} />
          </motion.button>
        </div>

        <div className="space-y-2.5 pb-4">
          {recentTransactions.length === 0 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 bg-white dark:bg-white/2 rounded-3xl border border-dashed border-border dark:border-white/5"
            >
              <div className="size-14 bg-background-light dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-white/60 border border-transparent dark:border-white/5">
                <Receipt size={28} strokeWidth={1} />
              </div>
              <p className="text-secondary text-[11px] font-black uppercase tracking-[0.2em]">
                {currentLang === 'th' ? 'ไม่มีรายการชำระเงิน' : 'No entries yet'}
              </p>
              <button
                disabled={!canCreateTransactions}
                onClick={() => onNavigate('add_transaction')}
                className={`mt-4 text-[10px] font-black uppercase tracking-widest ${
                  canCreateTransactions
                    ? 'text-primary dark:text-[#9B66FF]'
                    : 'text-secondary opacity-60 cursor-not-allowed'
                }`}
              >
                {canCreateTransactions
                  ? currentLang === 'th'
                    ? 'เพิ่มรายการแรกเลย'
                    : 'Add First Transaction'
                  : currentLang === 'th'
                    ? 'เข้าสู่ระบบเพื่อเริ่มต้น'
                    : 'Login to Start'}
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

      <div className="h-3" />
    </div>
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
      className="flex items-center gap-3.5 bg-white dark:bg-white/2 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 hover:bg-background-light dark:hover:bg-white/5 transition-all group cursor-pointer"
    >
      <div
        className="size-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 bg-background-light dark:bg-white/10 border border-transparent dark:border-white/5"
        style={colorStyles.style}
      >
        <span className={colorStyles.className}>
          {React.cloneElement(iconNode as React.ReactElement, { size: 20, strokeWidth: 1.5 })}
        </span>
      </div>
      <div className="flex-1 flex justify-between items-center overflow-hidden">
        <div className="overflow-hidden">
          <p className="text-text-dark dark:text-slate-100 font-black text-[14px] truncate tracking-tight">
            {displayName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] font-black text-secondary uppercase tracking-widest">{displayCategory}</span>
            <span className="size-0.5 bg-slate-200 dark:bg-white/10 rounded-full"></span>
            <span className="text-[9px] font-bold text-secondary opacity-60 uppercase tracking-wider">
              {formatDateShort(date, currentLang === 'th' ? 'th-TH' : 'en-US')}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`${
              isTransfer
                ? 'text-blue-500 dark:text-blue-400'
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
