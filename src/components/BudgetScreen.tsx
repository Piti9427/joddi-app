import React, { useMemo, useState } from 'react';
import { Target, Plus, Trash2, X, ChevronDown } from 'lucide-react';
import { ViewState, Transaction } from '../App';
import { formatMoney } from '../lib/formatters';
import { motion, AnimatePresence } from 'motion/react';

type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface BudgetItem {
  id: string;
  category: string;
  limit: number;
  period: BudgetPeriod;
  icon: string;
}

const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const DEFAULT_ICONS: Record<string, string> = {
  Food: '🍔', Shopping: '🛍️', Transport: '🚗', Entertainment: '🍿',
  Lifestyle: '☕', Coffee: '☕', Salary: '💰', Education: '📚',
  Health: '🏥', Utilities: '💡', Rent: '🏠', Travel: '✈️',
};

const STORAGE_KEY = 'joddi_budgets';

function loadBudgets(): BudgetItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { id: '1', category: 'Food', limit: 200, period: 'daily', icon: '🍔' },
    { id: '2', category: 'Shopping', limit: 3000, period: 'monthly', icon: '🛍️' },
    { id: '3', category: 'Transport', limit: 1500, period: 'monthly', icon: '🚗' },
    { id: '4', category: 'Entertainment', limit: 800, period: 'monthly', icon: '🍿' },
  ];
}

function saveBudgets(budgets: BudgetItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets)); } catch {}
}

export function BudgetScreen({ onNavigate, transactions }: { onNavigate: (v: ViewState) => void, transactions: Transaction[] }) {
  const [budgets, setBudgets] = useState<BudgetItem[]>(loadBudgets);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewPeriod, setViewPeriod] = useState<BudgetPeriod>('monthly');

  const persist = (next: BudgetItem[]) => { setBudgets(next); saveBudgets(next); };

  const removeBudget = (id: string) => {
    persist(budgets.filter(b => b.id !== id));
  };

  const addBudget = (item: Omit<BudgetItem, 'id'>) => {
    const newItem: BudgetItem = { ...item, id: Date.now().toString(36) };
    persist([...budgets, newItem]);
    setShowAddForm(false);
  };

  // Calculate spending per category normalised to the currently-selected viewPeriod
  const { totalBudgetLimit, totalSpent, categoryData } = useMemo(() => {
    const now = new Date();

    // Calculate spending from transactions within the viewPeriod
    const periodFilteredTx = transactions.filter(t => {
      if (t.type !== 'Expense') return false;
      const d = new Date(t.date);

      switch (viewPeriod) {
        case 'daily':
          return d.toDateString() === now.toDateString();
        case 'weekly': {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 6);
          weekAgo.setHours(0, 0, 0, 0);
          return d >= weekAgo;
        }
        case 'monthly':
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        case 'yearly':
          return d.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    // Spending map by category
    const spendingMap: Record<string, number> = {};
    periodFilteredTx.forEach(t => {
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

    const data = budgets.map(b => {
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
    }).sort((a, b) => b.rawPercent - a.rawPercent);

    return { totalBudgetLimit: totalLimit, totalSpent: totalSpend, categoryData: data };
  }, [transactions, budgets, viewPeriod]);

  const fmt = (v: number) => formatMoney(v, { maximumFractionDigits: 0 });
  const totalPct = totalBudgetLimit > 0 ? Math.min((totalSpent / totalBudgetLimit) * 100, 100) : 0;
  const totalLeft = Math.max(totalBudgetLimit - totalSpent, 0);

  const periodLabel = PERIOD_LABELS[viewPeriod];

  return (
    <div className="flex flex-col min-h-full pb-6 relative bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}>
        <div className="size-10 shrink-0"></div>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center text-text-dark dark:text-white">Budgets</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="text-primary hover:text-text-dark transition-colors p-2 bg-highlight dark:bg-primary/20 rounded-full"
        >
          <Plus size={20} />
        </button>
      </header>

      <main className="p-4 flex flex-col flex-1 space-y-6">

        {/* Period Selector */}
        <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
          {(['daily', 'weekly', 'monthly', 'yearly'] as BudgetPeriod[]).map(p => {
            const active = viewPeriod === p;
            return (
              <button
                key={p}
                onClick={() => setViewPeriod(p)}
                className={`relative py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'text-text-dark dark:text-slate-900' : 'text-secondary opacity-70'}`}
              >
                {active && (
                  <motion.span
                    layoutId="budget-period-pill"
                    className="absolute inset-0 rounded-lg bg-white dark:bg-white shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                  />
                )}
                <span className="relative z-10">{PERIOD_LABELS[p]}</span>
              </button>
            );
          })}
        </div>

        {/* Overall Budget Card */}
        <section className="bg-primary rounded-3xl p-6 shadow-xl shadow-primary/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-white/10">
            <Target size={120} />
          </div>
          <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-2 relative z-10">{periodLabel} Budget</p>
          <div className="flex items-end gap-2 mb-6 relative z-10">
            <h2 className="text-4xl font-extrabold tracking-tight">{fmt(totalSpent)}</h2>
            <p className="text-white/60 text-lg font-medium mb-1">/ {fmt(totalBudgetLimit)}</p>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span>{fmt(totalLeft)} left</span>
              <span>{totalPct.toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full shadow-sm transition-all duration-700 ${totalPct > 90 ? 'bg-rose-300' : 'bg-white'}`}
                style={{ width: `${totalPct}%` }}
              />
            </div>
          </div>
        </section>

        {/* Category Budgets */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-text-dark dark:text-slate-100">Category Limits</h3>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wide">{categoryData.length} active</span>
          </div>
          <div className="space-y-3">
            {categoryData.length === 0 ? (
              <div className="text-center py-12 text-secondary text-sm font-bold opacity-60">
                No budgets set yet. Tap + to add one.
              </div>
            ) : (
              categoryData.map(cat => (
                <BudgetCard
                  key={cat.id}
                  label={cat.category}
                  spent={cat.spent}
                  limit={cat.normalisedLimit}
                  originalLimit={cat.limit}
                  originalPeriod={cat.period}
                  icon={cat.icon}
                  warning={cat.warning}
                  over={cat.over}
                  percent={cat.percent}
                  onDelete={() => removeBudget(cat.id)}
                />
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
            existingCategories={budgets.map(b => b.category)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Budget Card ── */
function BudgetCard({ label, spent, limit, originalLimit, originalPeriod, icon, warning, over, percent, onDelete }: {
  label: string; spent: number; limit: number; originalLimit: number; originalPeriod: BudgetPeriod; icon: string;
  warning: boolean; over: boolean; percent: number; onDelete: () => void;
}) {
  const fmt = (v: number) => formatMoney(v, { maximumFractionDigits: 0 });

  let barColor = 'bg-primary';
  let badgeColor = 'bg-highlight text-primary dark:bg-primary/20';
  let statusText = 'On Track';

  if (warning) {
    barColor = 'bg-amber-500';
    badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    statusText = 'Nearing Limit';
  }
  if (over) {
    barColor = 'bg-rose-500';
    badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
    statusText = 'Over Budget';
  }

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800 group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-input-bg dark:bg-slate-800 rounded-xl flex items-center justify-center text-lg shadow-sm">
            {icon}
          </div>
          <div>
            <p className="font-bold text-text-dark dark:text-slate-100 text-[15px]">{label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                {statusText}
              </span>
              <span className="text-[9px] text-secondary font-bold opacity-60">
                ({fmt(originalLimit)}/{PERIOD_LABELS[originalPeriod].toLowerCase()})
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-expense p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex justify-between items-end mb-2">
        <p className="font-bold text-lg text-text-dark dark:text-slate-100">{fmt(spent)}</p>
        <p className="font-bold text-sm text-secondary">of {fmt(limit)}</p>
      </div>
      <div className="h-2 w-full bg-input-bg dark:bg-slate-800 rounded-full overflow-hidden">
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
function AddBudgetModal({ onClose, onAdd, existingCategories }: {
  onClose: () => void;
  onAdd: (item: Omit<BudgetItem, 'id'>) => void;
  existingCategories: string[];
}) {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const suggestedCategories = Object.keys(DEFAULT_ICONS).filter(c => !existingCategories.includes(c));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimCat = category.trim();
    if (!trimCat || !limit || parseFloat(limit) <= 0) return;

    onAdd({
      category: trimCat,
      limit: parseFloat(limit),
      period,
      icon: DEFAULT_ICONS[trimCat] || '🏷️',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-white dark:bg-surface-dark rounded-t-[2rem] p-6 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-text-dark dark:text-white">Add Budget</h2>
          <button onClick={onClose} className="text-secondary hover:text-text-dark dark:hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Input */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Category</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Food, Transport..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm font-bold text-text-dark dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
            />
            {suggestedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {suggestedCategories.slice(0, 6).map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${category === c ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-secondary'}`}
                  >
                    {DEFAULT_ICONS[c]} {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Budget Limit */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Limit Amount (฿)</label>
            <input
              type="number"
              inputMode="decimal"
              value={limit}
              onChange={e => setLimit(e.target.value)}
              placeholder="0.00"
              min="0"
              step="any"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm font-bold text-text-dark dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Period Selector */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Budget Period</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm font-bold text-text-dark dark:text-white flex justify-between items-center"
              >
                <span>{PERIOD_LABELS[period]}</span>
                <ChevronDown size={16} className={`text-secondary transition-transform ${showPeriodMenu ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showPeriodMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl z-20"
                  >
                    {(['daily', 'weekly', 'monthly', 'yearly'] as BudgetPeriod[]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setPeriod(p); setShowPeriodMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${period === p ? 'bg-primary/10 text-primary' : 'text-text-dark dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        {PERIOD_LABELS[p]}
                        <span className="text-[10px] text-secondary ml-2">
                          {p === 'daily' && '(e.g. ฿200/day)'}
                          {p === 'weekly' && '(e.g. ฿1,500/week)'}
                          {p === 'monthly' && '(e.g. ฿5,000/month)'}
                          {p === 'yearly' && '(e.g. ฿60,000/year)'}
                        </span>
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
            disabled={!category.trim() || !limit || parseFloat(limit) <= 0}
            className="w-full bg-text-dark dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl mt-2 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            <Plus size={18} />
            Add Budget
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
