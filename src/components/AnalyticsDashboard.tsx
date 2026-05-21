import React, { useMemo, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ViewState, Transaction } from '../App';
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  BrainCircuit,
  LineChart,
  Sparkles,
  ChevronLeft,
  Receipt,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getLocalAiInsight } from '../lib/aiInsights';
import { formatMoney } from '../lib/formatters';
import { getDateRangeBoundaries } from '../lib/dateUtils';
import { LocalCategory, getLocalBudgets, type LocalBudget } from '../lib/supabase';
import { isHex, getHexFromTailwind, ICONS } from '../lib/categoryUtils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
);

type ChartType = 'Bar' | 'Line';
const RANGE_LABELS = {
  Week: 'สัปดาห์',
  Month: 'เดือน',
  Year: 'ปี',
} as const;

const CATEGORY_COLORS = [
  '#7A36FF', // Purple
  '#FF6A39', // Orange
  '#1E1E2F', // Navy
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#ef4444', // Red
  '#6366f1', // Indigo
];

export function AnalyticsDashboard({
  onNavigate,
  transactions,
  categories = [],
  lang = 'th',
  currency = 'THB',
}: Readonly<{
  onNavigate: (v: ViewState, payload?: any) => void;
  transactions: Transaction[];
  categories?: LocalCategory[];
  lang?: 'th' | 'en';
  currency?: string;
}>) {
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Month');
  const [chartType, setChartType] = useState<ChartType>('Line');
  const [dataType, setDataType] = useState<'expense' | 'income' | 'compare'>('expense');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [budgets, setBudgets] = useState<LocalBudget[]>([]);

  // Sync theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Load budgets for calculations
  useEffect(() => {
    getLocalBudgets()
      .then(setBudgets)
      .catch((err) => console.error('Failed to load budgets inside analytics', err));
  }, []);

  const { totalIncome, totalExpense, chartEntries, expenseByCategory, aiInsight } = useMemo(() => {
    const boundaries = getDateRangeBoundaries();
    const now = new Date();
    let income = 0;
    let expense = 0;

    const chartMap: { [key: string]: { income: number; expense: number } } = {};
    const orderedKeys: string[] = [];
    const catMap: { [key: string]: number } = {};

    if (timeRange === 'Week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(boundaries.now - i * 24 * 60 * 60 * 1000);
        const key = d.toLocaleDateString('th-TH', { weekday: 'short' });
        orderedKeys.push(key);
        chartMap[key] = { income: 0, expense: 0 };
      }
    } else if (timeRange === 'Month') {
      ['สัปดาห์ 1', 'สัปดาห์ 2', 'สัปดาห์ 3', 'สัปดาห์ 4', 'สัปดาห์ 5'].forEach((w) => {
        orderedKeys.push(w);
        chartMap[w] = { income: 0, expense: 0 };
      });
    } else if (timeRange === 'Year') {
      for (let m = 0; m < 12; m++) {
        const d = new Date(now.getFullYear(), m, 1);
        const key = d.toLocaleDateString('th-TH', { month: 'short' });
        orderedKeys.push(key);
        chartMap[key] = { income: 0, expense: 0 };
      }
    }

    const filtered = transactions.filter((t) => {
      const tTime = new Date(t.date).getTime();
      if (timeRange === 'Week') {
        return tTime >= boundaries.rollingWeekStart;
      }
      if (timeRange === 'Month') {
        return tTime >= boundaries.monthStart;
      }
      if (timeRange === 'Year') {
        const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
        return tTime >= yearStart;
      }
      return true;
    });

    filtered.forEach((t) => {
      if (t.type === 'Income') {
        income += t.amount;
      } else if (t.type === 'Expense') {
        expense += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }

      let key = '';
      const d = new Date(t.date);

      if (timeRange === 'Week') {
        key = d.toLocaleDateString('th-TH', { weekday: 'short' });
      } else if (timeRange === 'Month') {
        const dayOfMonth = d.getDate();
        const weekNum = Math.ceil(dayOfMonth / 7);
        key = `สัปดาห์ ${Math.min(weekNum, 5)}`;
      } else if (timeRange === 'Year') {
        key = d.toLocaleDateString('th-TH', { month: 'short' });
      }

      if (chartMap[key]) {
        if (t.type === 'Income') {
          chartMap[key].income += t.amount;
        } else if (t.type === 'Expense') {
          chartMap[key].expense += t.amount;
        }
      }
    });

    const entries = orderedKeys.map((k) => [k, chartMap[k]] as [string, { income: number; expense: number }]);

    // Logic to use category colors
    const colorMap = new Map<string, string>();
    categories.forEach((cat) => {
      if (isHex(cat.color)) {
        colorMap.set(cat.name, cat.color);
      } else {
        colorMap.set(cat.name, getHexFromTailwind(cat.color));
      }
    });

    const expByCat = Object.entries(catMap)
      .map(([name, amount], i) => {
        const catObj = categories.find((c) => c.name === name);
        return {
          name,
          amount,
          color: colorMap.get(name) || CATEGORY_COLORS[i % CATEGORY_COLORS.length],
          iconName: catObj?.iconName ?? 'Receipt',
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome: income,
      totalExpense: expense,
      chartEntries: entries,
      expenseByCategory: expByCat,
      aiInsight: getLocalAiInsight(filtered),
    };
  }, [transactions, timeRange, categories]);

  const limitTotal = useMemo(() => {
    let sum = 0;
    budgets.forEach((b) => {
      let monthlyLimit = b.limit;
      if (b.period === 'daily') monthlyLimit = b.limit * 30;
      else if (b.period === 'weekly') monthlyLimit = b.limit * 4.33;
      else if (b.period === 'yearly') monthlyLimit = b.limit / 12;
      sum += monthlyLimit;
    });
    return sum;
  }, [budgets]);

  const spentPercentage = limitTotal > 0 ? Math.min((totalExpense / limitTotal) * 100, 100) : 0;
  const currentMonthName = new Date().toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  const fmt = (val: number, maximumFractionDigits = 0) =>
    formatMoney(val, {
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
    });

  return (
    <div className="flex flex-col min-h-full pb-32 relative bg-background-light dark:bg-background-dark">
      <header
        className="bg-white dark:bg-surface-dark px-4 pb-4 sticky top-0 z-20 shadow-sm border-b border-border/50 dark:border-white/5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}
      >
        <div className="flex items-center gap-3 h-12 mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="size-10 flex items-center justify-center bg-background-light dark:bg-white/5 rounded-xl text-secondary hover:text-text-dark transition-colors border border-transparent dark:border-white/5"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black tracking-tighter flex-1 text-center text-slate-900 dark:text-white mr-10 uppercase">
            Analytics
          </h1>
        </div>

        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-transparent dark:border-white/5">
          {(['Week', 'Month', 'Year'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all relative ${
                timeRange === r ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white/80'
              }`}
            >
              {timeRange === r && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{RANGE_LABELS[r]}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Main Stats (Purple & Orange Premium Gradient Cards) */}
        <section className="grid grid-cols-2 gap-4">
          <StatCard label={lang === 'th' ? 'รายรับทั้งหมด' : 'Total Income'} value={fmt(totalIncome)} type="income" />
          <StatCard
            label={lang === 'th' ? 'รายจ่ายทั้งหมด' : 'Total Expense'}
            value={fmt(totalExpense)}
            type="expense"
          />
        </section>

        {/* Monthly Spend Summary Banner (As seen in the 3rd phone UI) */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-border dark:border-white/5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10.5px] font-black text-secondary uppercase tracking-[0.2em] mb-1">
                {lang === 'th' ? 'ข้อมูลสรุปการใช้จ่าย' : 'Spend Summary'}
              </p>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-100 leading-snug">
                {lang === 'th' ? (
                  <>
                    คุณใช้จ่ายไปแล้ว <span className="text-[#FF6A39] font-black">{fmt(totalExpense)}</span> ในเดือนนี้
                  </>
                ) : (
                  <>
                    You have spent <span className="text-[#FF6A39] font-black">{fmt(totalExpense)}</span> this month.
                  </>
                )}
              </h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              {currentMonthName}
            </span>
          </div>

          {limitTotal > 0 ? (
            <div className="space-y-2.5">
              <div className="relative w-full h-7 bg-slate-100 dark:bg-white/5 rounded-full p-1 flex items-center overflow-hidden border border-slate-200/50 dark:border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPercentage}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-[#7A36FF] to-[#9b66ff] rounded-full flex items-center justify-center min-w-[60px]"
                >
                  <span className="text-[10px] font-black text-white px-2">{spentPercentage.toFixed(1)}%</span>
                </motion.div>
                {spentPercentage < 90 && (
                  <div className="flex-1 flex items-center justify-end pr-3">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                      {(100 - spentPercentage).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <span>{lang === 'th' ? `งบรวม: ${fmt(limitTotal)}` : `Total Limit: ${fmt(limitTotal)}`}</span>
                <span>
                  {lang === 'th'
                    ? `เหลือ: ${fmt(Math.max(limitTotal - totalExpense, 0))}`
                    : `Remains: ${fmt(Math.max(limitTotal - totalExpense, 0))}`}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(() => {
                const ratioVal = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;
                return (
                  <>
                    <div className="relative w-full h-7 bg-slate-100 dark:bg-white/5 rounded-full p-1 flex items-center overflow-hidden border border-slate-200/50 dark:border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ratioVal}%` }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-gradient-to-r from-[#FF6A39] to-[#FF8C66] rounded-full flex items-center justify-center min-w-[60px]"
                      >
                        <span className="text-[10px] font-black text-white px-2">{ratioVal.toFixed(1)}%</span>
                      </motion.div>
                      {ratioVal < 90 && (
                        <div className="flex-1 flex items-center justify-end pr-3">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">
                            {(100 - ratioVal).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>
                        {lang === 'th' ? `เทียบรายรับ: ${ratioVal.toFixed(0)}%` : `Of Income: ${ratioVal.toFixed(0)}%`}
                      </span>
                      <span>{lang === 'th' ? `รายรับ: ${fmt(totalIncome)}` : `Income: ${fmt(totalIncome)}`}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </section>

        {/* AI Insight */}
        {aiInsight && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#7A36FF]/5 to-[#FF6A39]/5 dark:from-white/5 dark:to-white/2 rounded-3xl p-5 border border-primary/10 dark:border-white/5 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/10 rounded-xl text-[#7A36FF] dark:text-[#9B66FF]">
                <BrainCircuit size={18} strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A36FF] dark:text-[#9B66FF]">
                AI Insight
              </span>
            </div>
            <h4 className="text-sm font-black text-[#7A36FF] dark:text-white mb-1 tracking-tight">{aiInsight.title}</h4>
            <p className="text-xs font-bold leading-relaxed text-slate-700 dark:text-white/60">{aiInsight.summary}</p>
            <Sparkles className="absolute -right-2 -bottom-2 text-primary/5 animate-pulse" size={80} />
          </motion.section>
        )}

        {/* Trends Chart */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-border dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                Trends
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {lang === 'th' ? 'เปรียบเทียบรับ - จ่าย' : 'Income vs Expense'}
              </p>
            </div>
            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg border border-transparent dark:border-white/5">
              <button
                onClick={() => setChartType('Bar')}
                className={`p-1.5 rounded-md transition-all ${
                  chartType === 'Bar'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <BarChart3 size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setChartType('Line')}
                className={`p-1.5 rounded-md transition-all ${
                  chartType === 'Line'
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <LineChart size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-transparent dark:border-white/5 mb-6">
            {(['expense', 'income', 'compare'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDataType(t)}
                className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all relative ${
                  dataType === t ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white/80'
                }`}
              >
                {dataType === t && (
                  <motion.div
                    layoutId="activeChartDataType"
                    className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">
                  {t === 'expense'
                    ? lang === 'th'
                      ? 'รายจ่าย'
                      : 'Expenses'
                    : t === 'income'
                      ? lang === 'th'
                        ? 'รายรับ'
                        : 'Income'
                      : lang === 'th'
                        ? 'เปรียบเทียบ'
                        : 'Compare'}
                </span>
              </button>
            ))}
          </div>

          <div className="h-64 -mx-2">
            <MainChart data={chartEntries} type={chartType} isDark={isDark} dataType={dataType} />
          </div>
        </section>

        {/* Categories Breakdown */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-5 border border-border dark:border-white/5 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">
            {lang === 'th' ? 'การใช้จ่ายแยกตามหมวดหมู่' : 'Category Breakdown'}
          </h3>

          <div className="flex flex-col items-center gap-8">
            <div className="relative w-full h-64">
              <DoughnutChart data={expenseByCategory} isDark={isDark} lang={lang} />
            </div>

            <div className="w-full space-y-3.5">
              {expenseByCategory.length > 0 ? (
                expenseByCategory.map((cat) => {
                  const catBudget = budgets.find((b) => b.category === cat.name);
                  const budgetLimit = catBudget
                    ? catBudget.period === 'monthly'
                      ? catBudget.limit
                      : catBudget.period === 'daily'
                        ? catBudget.limit * 30
                        : catBudget.limit / 12
                    : 0;
                  const ratio =
                    budgetLimit > 0
                      ? Math.min((cat.amount / budgetLimit) * 100, 100)
                      : totalExpense > 0
                        ? (cat.amount / totalExpense) * 100
                        : 0;

                  return (
                    <div
                      key={cat.name}
                      className="bg-white dark:bg-white/3 p-4 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex flex-col gap-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-10 flex items-center justify-center rounded-2xl transition-transform hover:scale-105"
                            style={{
                              backgroundColor: `${cat.color}15`,
                              color: cat.color,
                            }}
                          >
                            {ICONS[cat.iconName] || <Receipt size={20} />}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">
                              {cat.name}
                            </h4>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                              {budgetLimit > 0
                                ? lang === 'th'
                                  ? `งบประมาณเฉพาะหมวด`
                                  : `Category Limit`
                                : lang === 'th'
                                  ? `สัดส่วนรายจ่ายรวม`
                                  : `Ratio of Total`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                            {fmt(cat.amount)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                            {budgetLimit > 0
                              ? lang === 'th'
                                ? `จาก ${fmt(budgetLimit)}`
                                : `of ${fmt(budgetLimit)}`
                              : `${ratio.toFixed(1)}%`}
                          </span>
                        </div>
                      </div>

                      {/* Sub progress bar underneath each category */}
                      <div className="space-y-1.5">
                        <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${ratio}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                        </div>
                        {budgetLimit > 0 && (
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>
                              {lang === 'th'
                                ? `เหลือ: ${fmt(Math.max(budgetLimit - cat.amount, 0))}`
                                : `Remaining: ${fmt(Math.max(budgetLimit - cat.amount, 0))}`}
                            </span>
                            <span className="font-extrabold" style={{ color: cat.color }}>
                              {ratio.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {lang === 'th' ? 'ไม่มีข้อมูลการใช้จ่าย' : 'No data available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  type,
}: Readonly<{
  label: string;
  value: string;
  type: 'income' | 'expense';
}>) {
  const isIncome = type === 'income';
  return (
    <div
      className={`p-5 rounded-3xl border border-white/10 flex flex-col justify-between aspect-[1.25/1] shadow-[0_8px_32px_rgba(31,38,135,0.07)] text-white overflow-hidden relative transition-all duration-300 hover:translate-y-[-2px] ${
        isIncome
          ? 'bg-gradient-to-br from-[#7A36FF] via-[#6a29ec] to-[#5516d5] shadow-[0_8px_20px_-6px_rgba(122,54,255,0.4)]'
          : 'bg-gradient-to-br from-[#FF6A39] via-[#f55925] to-[#db4411] shadow-[0_8px_20px_-6px_rgba(255,106,57,0.4)]'
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-white/5 blur-xl pointer-events-none" />

      <div className="flex justify-between items-start z-10">
        <span className="text-white/70 text-[9px] font-black uppercase tracking-[0.15em]">{label}</span>
        <div className="p-1.5 bg-white/10 rounded-xl">
          {isIncome ? (
            <ArrowUpRight size={14} className="text-white" />
          ) : (
            <ArrowDownRight size={14} className="text-white" />
          )}
        </div>
      </div>

      <div className="z-10 my-2">
        <h2 className="text-xl font-black tabular-nums tracking-tight leading-none">{value}</h2>
      </div>

      <div className="z-10 flex items-center gap-1.5 text-[9px] font-bold text-white/60 uppercase tracking-widest">
        <div className="size-1.5 rounded-full bg-white/40" />
        <span>{isIncome ? 'Wallet' : 'Expenses'}</span>
      </div>
    </div>
  );
}

const barBackgroundPlugin = {
  id: 'barBackground',
  beforeDatasetsDraw(chart: any) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { top, bottom } = chartArea;
    const isDark = chart.options.isDark;

    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(241, 245, 249, 0.8)';

    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.type === 'bar' && !meta.hidden) {
        meta.data.forEach((bar: any) => {
          const width = bar.width || 12;
          const radius = 6;
          const height = bottom - top;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bar.x - width / 2, top, width, height, radius);
          } else {
            ctx.rect(bar.x - width / 2, top, width, height);
          }
          ctx.fill();
        });
      }
    });
    ctx.restore();
  },
};

const lineGlowPlugin = {
  id: 'lineGlow',
  beforeDatasetDraw(chart: any, args: any) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[args.index];
    if (dataset.type === 'line' || chart.config.type === 'line') {
      ctx.save();
      if (dataset.borderColor === '#7A36FF') {
        ctx.shadowColor = 'rgba(122, 54, 255, 0.35)';
      } else if (dataset.borderColor === '#FF6A39') {
        ctx.shadowColor = 'rgba(255, 106, 57, 0.35)';
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      }
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
    }
  },
  afterDatasetDraw(chart: any, args: any) {
    const { ctx } = chart;
    const dataset = chart.data.datasets[args.index];
    if (dataset.type === 'line' || chart.config.type === 'line') {
      ctx.restore();
    }
  },
};

const barValuePlugin = {
  id: 'barValue',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    ctx.save();
    const activeIdx = chart.options.activeIdx;
    const isDark = chart.options.isDark;

    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.type === 'bar' && !meta.hidden) {
        meta.data.forEach((bar: any, index: number) => {
          const val = dataset.data[index];
          if (val > 0) {
            const formatted = formatMoney(Number(val), { compact: true });
            const isHighlighted = index === activeIdx;

            ctx.beginPath();
            if (isHighlighted) {
              ctx.font = '900 10.5px Outfit, sans-serif';
              ctx.fillStyle =
                dataset.borderColor === '#7A36FF'
                  ? '#7A36FF'
                  : dataset.borderColor === '#FF6A39'
                    ? '#FF6A39'
                    : isDark
                      ? '#ffffff'
                      : '#0f172a';
            } else {
              ctx.font = 'bold 9.5px Outfit, sans-serif';
              ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(71, 85, 105, 0.6)';
            }
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(formatted, bar.x, bar.y - 6);
          }
        });
      }
    });
    ctx.restore();
  },
};

const doughnutLabelsPlugin = {
  id: 'doughnutLabels',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    ctx.save();
    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.type !== 'doughnut') return;

      const total = dataset.data.reduce((sum: number, val: number) => sum + val, 0);
      if (total === 0) return;

      meta.data.forEach((element: any, index: number) => {
        const value = dataset.data[index];
        const percentage = ((value / total) * 100).toFixed(0);

        if (Number(percentage) < 6) return;

        // Get middle angle
        const view = element;
        const startAngle = view.startAngle;
        const endAngle = view.endAngle;
        const middleAngle = startAngle + (endAngle - startAngle) / 2;

        // Get middle radius
        const innerRadius = view.innerRadius;
        const outerRadius = view.outerRadius;
        const middleRadius = innerRadius + (outerRadius - innerRadius) / 2;

        // Calculate coordinates
        const x = view.x + Math.cos(middleAngle) * middleRadius;
        const y = view.y + Math.sin(middleAngle) * middleRadius;

        // Draw text
        ctx.font = '900 10px Outfit, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;

        ctx.fillText(`${percentage}%`, x, y);
      });
    });
    ctx.restore();
  },
};

const doughnutCalloutsPlugin = {
  id: 'doughnutCallouts',
  afterDatasetsDraw(chart: any) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const isDark = chart.options.isDark;

    ctx.save();
    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.type !== 'doughnut') return;

      const total = dataset.data.reduce((sum: number, val: number) => sum + val, 0);
      if (total === 0) return;

      meta.data.forEach((element: any, index: number) => {
        const value = dataset.data[index];
        const percentage = (value / total) * 100;

        // Skip drawing labels for very small slices (less than 8%) to avoid overlaps
        if (percentage < 8) return;

        const label = chart.data.labels[index];
        const startAngle = element.startAngle;
        const endAngle = element.endAngle;
        const middleAngle = startAngle + (endAngle - startAngle) / 2;

        const cos = Math.cos(middleAngle);
        const sin = Math.sin(middleAngle);

        const outerRadius = element.outerRadius;
        const startX = element.x + cos * outerRadius;
        const startY = element.y + sin * outerRadius;

        // Inflexion point
        const inflexionX = element.x + cos * (outerRadius + 14);
        const inflexionY = element.y + sin * (outerRadius + 14);

        // Horizontal line end point
        const isLeft = cos < 0;
        const endX = inflexionX + (isLeft ? -15 : 15);
        const endY = inflexionY;

        // Draw callout lines
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(inflexionX, inflexionY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(100, 116, 139, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw small dot on slice edge
        ctx.beginPath();
        ctx.arc(startX, startY, 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = dataset.backgroundColor[index];
        ctx.fill();

        // Draw category dot next to text
        const dotRadius = 3.5;
        const dotX = endX + (isLeft ? -10 : 10);
        const dotY = endY - 4; // Center dot with text baseline
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = dataset.backgroundColor[index];
        ctx.fill();

        // Draw category label text
        ctx.font = '900 10px Outfit, sans-serif';
        ctx.fillStyle = isDark ? '#ffffff' : '#1e293b';
        ctx.textAlign = isLeft ? 'right' : 'left';
        ctx.textBaseline = 'bottom';
        const textOffsetX = endX + (isLeft ? -18 : 18);
        ctx.fillText(label, textOffsetX, endY + 1);

        // Draw amount and percentage text below
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textBaseline = 'top';
        const amountText = `${formatMoney(value)} (${percentage.toFixed(0)}%)`;
        ctx.fillText(amountText, textOffsetX, endY + 3);
      });
    });
    ctx.restore();
  },
};

const hoverLinePlugin = {
  id: 'hoverLine',
  afterDatasetsDraw(chart: any) {
    const { ctx, tooltip, chartArea } = chart;
    if (!chartArea) return;
    if (chart.config.type !== 'line') return;
    if (tooltip && tooltip.opacity > 0) {
      const x = tooltip.caretX;
      const top = chartArea.top;
      const bottom = chartArea.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.strokeStyle = chart.options.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }
  },
};

function getBarGradient(ctx: CanvasRenderingContext2D, chartArea: any, startColor: string, endColor: string) {
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  return gradient;
}

function MainChart({
  data,
  type,
  isDark,
  dataType,
}: Readonly<{
  data: ReadonlyArray<[string, { income: number; expense: number }]>;
  type: ChartType;
  isDark: boolean;
  dataType: 'expense' | 'income' | 'compare';
}>) {
  const labels = data.map((d) => d[0]);
  const incomeData = data.map((d) => d[1].income);
  const expenseData = data.map((d) => d[1].expense);

  // Default active index: locate the element with the maximum value in the active dataset
  const maxIdx = useMemo(() => {
    let maxVal = -1;
    let maxIdx = 0;
    data.forEach((d, idx) => {
      const val = dataType === 'income' ? d[1].income : d[1].expense;
      if (val > maxVal) {
        maxVal = val;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [data, dataType]);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeIdx = hoveredIndex !== null ? hoveredIndex : maxIdx;

  const datasets = [];

  if (dataType === 'income' || dataType === 'compare') {
    datasets.push({
      label: 'รายรับ',
      data: incomeData,
      borderColor: '#7A36FF',
      backgroundColor:
        type === 'Bar'
          ? (context: any) => {
              const index = context.dataIndex;
              const isHighlighted = index === activeIdx;
              if (isHighlighted) {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return '#7A36FF';
                return getBarGradient(ctx, chartArea, '#7A36FF', '#9b66ff');
              }
              return isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';
            }
          : (context: any) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return 'rgba(122, 54, 255, 0.1)';
              const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, 'rgba(122, 54, 255, 0.25)');
              gradient.addColorStop(1, 'rgba(122, 54, 255, 0)');
              return gradient;
            },
      fill: type === 'Line',
      tension: 0.4,
      borderWidth: type === 'Bar' ? 0 : 4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 3,
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#7A36FF',
      borderRadius: type === 'Bar' ? 6 : 0,
      barThickness: type === 'Bar' ? 12 : undefined,
      maxBarThickness: type === 'Bar' ? 16 : undefined,
    });
  }

  if (dataType === 'expense' || dataType === 'compare') {
    datasets.push({
      label: 'รายจ่าย',
      data: expenseData,
      borderColor: '#FF6A39',
      backgroundColor:
        type === 'Bar'
          ? (context: any) => {
              const index = context.dataIndex;
              const isHighlighted = index === activeIdx;
              if (isHighlighted) {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return '#FF6A39';
                return getBarGradient(ctx, chartArea, '#FF6A39', '#FF8C66');
              }
              return isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';
            }
          : (context: any) => {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return 'rgba(255, 106, 57, 0.1)';
              const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, 'rgba(255, 106, 57, 0.25)');
              gradient.addColorStop(1, 'rgba(255, 106, 57, 0)');
              return gradient;
            },
      fill: type === 'Line',
      tension: 0.4,
      borderWidth: type === 'Bar' ? 0 : 4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 3,
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#FF6A39',
      borderRadius: type === 'Bar' ? 6 : 0,
      barThickness: type === 'Bar' ? 12 : undefined,
      maxBarThickness: type === 'Bar' ? 16 : undefined,
    });
  }

  const chartData = {
    labels,
    datasets,
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    isDark,
    activeIdx,
    onHover: (event: any, activeElements: any) => {
      if (activeElements && activeElements.length > 0) {
        setHoveredIndex(activeElements[0].index);
      } else {
        setHoveredIndex(null);
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDark ? '#1e293b' : '#fff',
        titleColor: isDark ? '#fff' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#64748b',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const val = context.parsed.y;
            return `${context.dataset.label}: ${formatMoney(val)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 9, weight: '700', family: 'Inter, sans-serif' },
          padding: 8,
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          drawTicks: false,
          borderDash: [5, 5],
        },
        border: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 9, weight: '700', family: 'Inter, sans-serif' },
          padding: 8,
          callback: (val: any) => formatMoney(Number(val), { compact: true }),
        },
      },
    },
  };

  return type === 'Bar' ? (
    <Bar data={chartData} options={options} plugins={[barBackgroundPlugin, barValuePlugin]} />
  ) : (
    <Line data={chartData} options={options} plugins={[lineGlowPlugin, hoverLinePlugin]} />
  );
}

function DoughnutChart({
  data,
  isDark,
  lang = 'th',
}: Readonly<{
  data: ReadonlyArray<{ name: string; amount: number; color: string }>;
  isDark: boolean;
  lang?: 'th' | 'en';
}>) {
  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.amount),
        backgroundColor: data.map((d) => d.color),
        borderWidth: 0,
        spacing: data.length > 1 ? 5 : 0,
        borderRadius: data.length > 1 ? 8 : 0,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    layout: {
      padding: {
        top: 25,
        bottom: 25,
        left: 55,
        right: 55,
      },
    },
    isDark,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#fff',
        titleColor: isDark ? '#fff' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#64748b',
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const val = context.parsed;
            return ` ${formatMoney(val)}`;
          },
        },
      },
    },
  };

  const totalAmount = data.reduce((a, b) => a + b.amount, 0);

  return (
    <div
      className="relative w-full h-full"
      role="img"
      aria-label={
        lang === 'th'
          ? 'แผนภูมิวงกลมแสดงสัดส่วนรายจ่ายตามหมวดหมู่'
          : 'Doughnut chart showing expense breakdown by category'
      }
    >
      <Doughnut data={chartData} options={options} plugins={[doughnutLabelsPlugin, doughnutCalloutsPlugin]} />

      {/* Hidden structure for screen readers */}
      <div className="sr-only">
        <h3>{lang === 'th' ? 'สรุปรายจ่ายตามหมวดหมู่' : 'Expense breakdown by category'}</h3>
        <ul>
          {data.map((d) => (
            <li key={d.name}>
              {d.name}: {formatMoney(d.amount)}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em]">
          {lang === 'th' ? 'รวมทั้งหมด' : 'Total'}
        </span>
        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 tabular-nums">
          {formatMoney(totalAmount, { compact: false })}
        </span>
      </div>
    </div>
  );
}
