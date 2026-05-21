import React, { useMemo, useState } from 'react';
import { Target, Plus, Trash2, X, ChevronDown, ChevronLeft, Tag } from 'lucide-react';
import { ViewState, Transaction } from '../App';
import { formatMoney } from '../lib/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { getDateRangeBoundaries } from '../lib/dateUtils';
import {
  createLocalBudget,
  deleteLocalBudget,
  getLocalBudgets,
  saveLocalBudgets,
  syncAllOfflineData,
  type BudgetPeriod,
  type LocalBudget,
} from '../lib/supabase';

import { ICONS, ICON_OPTIONS } from '../lib/categoryUtils';

const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  daily: 'รายวัน',
  weekly: 'รายสัปดาห์',
  monthly: 'รายเดือน',
  yearly: 'รายปี',
};

const DEFAULT_CATEGORIES = [
  'Food',
  'Shopping',
  'Transport',
  'Entertainment',
  'Lifestyle',
  'Salary',
  'Education',
  'Health',
  'Utilities',
  'Rent',
  'Travel',
];

export function BudgetScreen({
  onNavigate,
  transactions,
}: Readonly<{
  onNavigate: (v: ViewState, payload?: any) => void;
  transactions: Transaction[];
}>) {
  const [budgets, setBudgets] = useState<LocalBudget[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewPeriod, setViewPeriod] = useState<BudgetPeriod>('monthly');

  React.useEffect(() => {
    const load = async () => {
      try {
        setBudgets(await getLocalBudgets());
      } catch (error) {
        console.error('Failed to load budgets', error);
      }
    };
    load();
    globalThis.addEventListener('joddi:budgets-changed', load);
    return () => globalThis.removeEventListener('joddi:budgets-changed', load);
  }, []);

  const persist = async (next: LocalBudget[]) => {
    setBudgets(next);
    await saveLocalBudgets(next);
    syncAllOfflineData().catch((error) => console.error('Budget sync error:', error));
  };

  const removeBudget = async (id: string) => {
    await deleteLocalBudget(id);
    setBudgets(await getLocalBudgets());
    syncAllOfflineData().catch((error) => console.error('Budget delete sync error:', error));
  };

  const addBudget = async (item: Omit<LocalBudget, 'id' | 'localId' | 'syncStatus' | 'updatedAt'>) => {
    const newItem = createLocalBudget(item);
    await persist([...budgets, newItem]);
    setShowAddForm(false);
  };

  // Calculate spending per category normalised to the currently-selected viewPeriod
  const { totalBudgetLimit, totalSpent, categoryData } = useMemo(() => {
    const boundaries = getDateRangeBoundaries();
    const now = new Date();

    // Calculate spending from transactions within the viewPeriod
    const periodFilteredTx = transactions.filter((t) => {
      if (t.type !== 'Expense') return false;
      const tTime = new Date(t.date).getTime();

      switch (viewPeriod) {
        case 'daily':
          return tTime >= boundaries.todayStart;
        case 'weekly':
          return tTime >= boundaries.rollingWeekStart;
        case 'monthly':
          return tTime >= boundaries.monthStart;
        case 'yearly': {
          const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
          return tTime >= yearStart;
        }
        default:
          return true;
      }
    });

    // Spending map by category
    const spendingMap: Record<string, number> = {};
    periodFilteredTx.forEach((t) => {
      spendingMap[t.category] = (spendingMap[t.category] || 0) + t.amount;
    });

    // Normalise each budget's limit to the view period
    const normaliseLimitToView = (limit: number, from: BudgetPeriod): number => {
      // First convert to daily
      const DAILY: Record<BudgetPeriod, number> = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };
      const dailyLimit = limit / DAILY[from];
      // Then convert to viewPeriod
      return dailyLimit * DAILY[viewPeriod];
    };

    let totalLimit = 0;
    let totalSpend = 0;

    const data = budgets
      .map((b) => {
        const normLimit = normaliseLimitToView(b.limit, b.period);
        const spent = spendingMap[b.category] || 0;
        totalLimit += normLimit;
        totalSpend += spent;

        const pct = normLimit > 0 ? (spent / normLimit) * 100 : 0;
        return {
          ...b,
          normalisedLimit: normLimit,
          spent,
          percent: Math.min(pct, 100),
          rawPercent: pct,
          warning: pct > 70 && pct <= 100,
          over: pct > 100,
        };
      })
      .sort((a, b) => b.rawPercent - a.rawPercent);

    return { totalBudgetLimit: totalLimit, totalSpent: totalSpend, categoryData: data };
  }, [transactions, budgets, viewPeriod]);

  const fmt = (v: number) => formatMoney(v, { maximumFractionDigits: 0 });
  const totalPct = totalBudgetLimit > 0 ? Math.min((totalSpent / totalBudgetLimit) * 100, 100) : 0;
  const totalLeft = Math.max(totalBudgetLimit - totalSpent, 0);

  const periodLabel = PERIOD_LABELS[viewPeriod];

  return (
    <div className="flex flex-col min-h-full pb-32 relative bg-background-light dark:bg-background-dark">
      <header
        className="flex items-center bg-background-light/85 dark:bg-background-dark/85 backdrop-blur-md p-4 border-b border-border/10 dark:border-white/5 sticky top-0 z-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}
      >
        <button
          onClick={() => onNavigate('dashboard')}
          className="size-10 flex items-center justify-center bg-white dark:bg-white/5 rounded-xl text-secondary hover:text-text-dark transition-colors border border-border/40 dark:border-white/5 shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black tracking-tighter flex-1 text-center text-text-dark dark:text-white uppercase">
          Budgets
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-primary hover:text-text-dark transition-colors p-2 bg-primary/5 dark:bg-white/5 rounded-full"
        >
          <Plus size={20} />
        </button>
      </header>

      <main className="p-4 flex flex-col flex-1 space-y-6">
        {/* Period Selector */}
        <div className="grid grid-cols-4 bg-slate-200/50 dark:bg-white/5 rounded-xl p-1 border border-transparent dark:border-white/5">
          {(['daily', 'weekly', 'monthly', 'yearly'] as BudgetPeriod[]).map((p) => {
            const active = viewPeriod === p;
            return (
              <button
                key={p}
                onClick={() => setViewPeriod(p)}
                className={`relative py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${active ? 'text-text-dark dark:text-primary' : 'text-secondary opacity-70'}`}
              >
                {active && (
                  <motion.span
                    layoutId="budget-period-pill"
                    className="absolute inset-0 rounded-lg bg-white dark:bg-white/10 shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                  />
                )}
                <span className="relative z-10">{PERIOD_LABELS[p]}</span>
              </button>
            );
          })}
        </div>

        {/* Overall Budget Card */}
        <section className="bg-text-dark dark:bg-white/2 rounded-3xl p-6 border border-transparent dark:border-white/5 text-white relative overflow-hidden ring-1 ring-white/5">
          <div className="absolute -right-6 -top-6 text-white/5 dark:text-white/5">
            <Target size={120} />
          </div>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2 relative z-10">
            {periodLabel} Budget
          </p>
          <div className="flex items-end gap-2 mb-6 relative z-10">
            <h2 className="text-4xl font-black tracking-tighter">{fmt(totalSpent)}</h2>
            <p className="text-white/20 text-lg font-bold mb-1 tabular-nums tracking-tighter">
              / {fmt(totalBudgetLimit)}
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-wider mb-2.5">
              <span className="text-white/60">Remains {fmt(totalLeft)}</span>
              <span className="text-white/80">{totalPct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${totalPct > 90 ? 'bg-rose-500' : 'bg-primary'}`}
                style={{ width: `${totalPct}%` }}
              />
            </div>
          </div>
        </section>

        {/* Category Budgets */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-text-dark dark:text-white uppercase tracking-[0.2em]">
              Category Limits
            </h3>
            <span className="text-[9px] font-black text-secondary uppercase tracking-[0.1em] opacity-60">
              {categoryData.length} active
            </span>
          </div>
          <div className="space-y-3">
            {categoryData.length === 0 ? (
              <div className="text-center py-12 text-secondary text-[11px] font-black uppercase tracking-[0.2em] opacity-60">
                No budgets set. Tap + to start.
              </div>
            ) : (
              categoryData.map((cat) => (
                <React.Fragment key={cat.id}>
                  <BudgetCard
                    label={cat.category}
                    spent={cat.spent}
                    limit={cat.normalisedLimit}
                    originalLimit={cat.limit}
                    originalPeriod={cat.period}
                    icon={cat.icon}
                    syncStatus={cat.syncStatus}
                    warning={cat.warning}
                    over={cat.over}
                    percent={cat.percent}
                    onDelete={() => removeBudget(cat.id)}
                  />
                </React.Fragment>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Add Budget Modal */}
      <AnimatePresence>
        {showAddForm && (
          <AddBudgetModal
            onClose={() => setShowAddForm(false)}
            onAdd={addBudget}
            existingCategories={budgets.map((b) => b.category)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Budget Card ── */
function BudgetCard({
  label,
  spent,
  limit,
  originalLimit,
  originalPeriod,
  icon,
  syncStatus,
  warning,
  over,
  percent,
  onDelete,
}: Readonly<{
  label: string;
  spent: number;
  limit: number;
  originalLimit: number;
  originalPeriod: BudgetPeriod;
  icon: string;
  syncStatus: string;
  warning: boolean;
  over: boolean;
  percent: number;
  onDelete: () => void;
}>) {
  const fmt = (v: number) => formatMoney(v, { maximumFractionDigits: 0 });

  let barColor = 'bg-primary';
  let badgeColor = 'bg-primary/5 text-primary dark:bg-white/10 dark:text-primary';
  let statusText = 'On Track';

  if (warning) {
    barColor = 'bg-amber-500';
    badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    statusText = 'Near Limit';
  }
  if (over) {
    barColor = 'bg-rose-500';
    badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
    statusText = 'Over Budget';
  }

  return (
    <div className="bg-white dark:bg-white/2 rounded-3xl p-5 border border-border/40 dark:border-white/5 shadow-sm group relative overflow-hidden">
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="size-11 bg-background-light dark:bg-white/5 rounded-xl flex items-center justify-center border border-transparent dark:border-white/5 text-primary dark:text-white">
            {ICONS[icon] ? <span className="scale-110">{ICONS[icon]}</span> : <span className="text-xl">{icon}</span>}
          </div>
          <div>
            <p className="font-black text-text-dark dark:text-white text-[15px] tracking-tight">{label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.1em] ${badgeColor}`}
              >
                {statusText}
              </span>
              <span className="text-[9px] text-secondary font-bold opacity-60 uppercase tracking-widest">
                {fmt(originalLimit)}/{originalPeriod.slice(0, 3)}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-rose-500 p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex justify-between items-end mb-2.5 relative z-10">
        <p className="font-black text-lg text-text-dark dark:text-white tabular-nums tracking-tighter">{fmt(spent)}</p>
        <p className="text-[10px] font-black text-secondary uppercase tracking-[0.1em]">of {fmt(limit)}</p>
      </div>
      <div className="h-1 w-full bg-background-light dark:bg-white/5 rounded-full overflow-hidden relative z-10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 80 }}
          className={`h-full ${barColor} rounded-full`}
        />
      </div>
    </div>
  );
}

/* ── Add Budget Modal ── */
function AddBudgetModal({
  onClose,
  onAdd,
  existingCategories,
}: Readonly<{
  onClose: () => void;
  onAdd: (item: Omit<LocalBudget, 'id' | 'localId' | 'syncStatus' | 'updatedAt'>) => void;
  existingCategories: string[];
}>) {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const suggestedCategories = DEFAULT_CATEGORIES.filter((c) => !existingCategories.includes(c));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimCat = category.trim();
    if (!trimCat || !limit || Number.parseFloat(limit) <= 0) return;

    onAdd({
      category: trimCat,
      limit: Number.parseFloat(limit),
      period,
      icon: trimCat,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-white dark:bg-surface-dark rounded-t-[2.5rem] border-t border-border dark:border-white/10 p-7 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black text-text-dark dark:text-white tracking-tight uppercase">New Budget</h2>
          <button onClick={onClose} className="text-secondary hover:text-text-dark dark:hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Input */}
          <div>
            <label
              htmlFor="budget-category"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary block mb-2.5 ml-1"
            >
              Category
            </label>
            <input
              id="budget-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Food, Travel"
              className="w-full bg-background-light dark:bg-white/5 border border-border/40 dark:border-white/5 rounded-2xl py-3.5 px-4 text-sm font-bold text-text-dark dark:text-white outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {suggestedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 ml-1">
                {suggestedCategories.slice(0, 6).map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${category === c ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10' : 'bg-background-light dark:bg-white/5 border-transparent text-secondary hover:border-slate-200 dark:hover:border-white/10'}`}
                  >
                    <span>
                      {ICONS[c] ? (
                        <span className="opacity-80 inline-block scale-75">{ICONS[c]}</span>
                      ) : (
                        <span className="opacity-80 inline-block scale-75">
                          <Tag size={20} />
                        </span>
                      )}
                    </span>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Budget Limit */}
          <div>
            <label
              htmlFor="budget-limit"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary block mb-2.5 ml-1"
            >
              Limit Amount (฿)
            </label>
            <input
              id="budget-limit"
              type="number"
              inputMode="decimal"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="0.00"
              min="0"
              step="any"
              className="w-full bg-background-light dark:bg-white/5 border border-border/40 dark:border-white/5 rounded-2xl py-3.5 px-4 text-sm font-bold text-text-dark dark:text-white tabular-nums outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Period Selector */}
          <div>
            <label
              htmlFor="budget-period"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary block mb-2.5 ml-1"
            >
              Period
            </label>
            <div className="relative">
              <button
                id="budget-period"
                type="button"
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                className="w-full bg-background-light dark:bg-white/5 border border-border/40 dark:border-white/5 rounded-2xl py-3.5 px-4 text-sm font-bold text-text-dark dark:text-white flex justify-between items-center outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <span className="uppercase tracking-wide">{PERIOD_LABELS[period]}</span>
                <ChevronDown
                  size={16}
                  className={`text-secondary transition-transform duration-300 ${showPeriodMenu ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {showPeriodMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl z-20"
                  >
                    {(['daily', 'weekly', 'monthly', 'yearly'] as BudgetPeriod[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPeriod(p);
                          setShowPeriodMenu(false);
                        }}
                        className={`w-full text-left px-5 py-3.5 text-xs font-black uppercase tracking-wider transition-colors ${period === p ? 'bg-primary text-white' : 'text-text-dark dark:text-white hover:bg-background-light dark:hover:bg-white/10'}`}
                      >
                        {PERIOD_LABELS[p]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!category.trim() || !limit || Number.parseFloat(limit) <= 0}
            className="w-full bg-text-dark dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] py-4.5 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
          >
            <Plus size={18} strokeWidth={3} />
            Create Budget
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
