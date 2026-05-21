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
import { Line, Bar } from 'react-chartjs-2';
import { ViewState, Transaction } from '../App';
import { ArrowDownRight, BarChart3, BrainCircuit, LineChart, Sparkles, ChevronLeft, Receipt } from 'lucide-react';
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
  '#7A36FF', // Brand Purple
  '#FF6A39', // Brand Orange
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#14B8A6', // Teal
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
      ['W1', 'W2', 'W3', 'W4', 'W5'].forEach((w) => {
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
        key = `W${Math.min(weekNum, 5)}`;
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

  const fmt = (val: number, maximumFractionDigits = 0) =>
    formatMoney(val, {
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
    });

  return (
    <div className="flex flex-col min-h-full pb-32 relative bg-background-light dark:bg-[#0A0A0B]">
      <header
        className="bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl px-4 pb-4 sticky top-0 z-30 border-b border-border/40 dark:border-white/5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}
      >
        <div className="flex items-center justify-between h-12 mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="size-10 flex items-center justify-center bg-background-light dark:bg-white/5 rounded-2xl text-secondary hover:text-text-dark transition-all border border-transparent dark:border-white/5"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase">Analytics</h1>
          <button className="size-10 flex items-center justify-center bg-background-light dark:bg-white/5 rounded-2xl text-secondary border border-transparent dark:border-white/5">
            <Sparkles size={18} />
          </button>
        </div>

        <div className="flex bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl border border-border/40 dark:border-white/5">
          {(['Week', 'Month', 'Year'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all relative ${
                timeRange === r ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white/80'
              }`}
            >
              {timeRange === r && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{RANGE_LABELS[r]}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-8">
        {/* Total Spending & Circular Progress Ring (Ref: Dribbble Top) */}
        <section className="bg-white dark:bg-[#121214] rounded-[32px] p-6 border border-border/40 dark:border-white/5 shadow-sm overflow-hidden relative">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">
                {lang === 'th' ? 'การใช้จ่ายทั้งหมด' : 'Total Spending'}
              </p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                {fmt(totalExpense)}
              </h2>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-2xl border border-border/20 dark:border-white/5">
              <ArrowDownRight className="text-[#FF6A39]" size={20} />
            </div>
          </div>

          <div className="flex items-center gap-8 py-2">
            <div className="relative size-36 shrink-0">
              <CircularProgress percentage={spentPercentage} color="#7A36FF" size={144} strokeWidth={14} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {spentPercentage.toFixed(0)}%
                </span>
                <span className="text-[8px] font-black text-secondary uppercase tracking-widest">
                  {lang === 'th' ? 'ใช้ไปแล้ว' : 'Spent'}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[9px] font-black text-secondary uppercase tracking-widest mb-1 opacity-60">
                  {lang === 'th' ? 'งบประมาณที่เหลือ' : 'Remaining Budget'}
                </p>
                <p className="text-base font-black text-slate-800 dark:text-white tabular-nums">
                  {fmt(Math.max(limitTotal - totalExpense, 0))}
                </p>
              </div>
              <div className="h-px bg-border/40 dark:bg-white/5 w-full" />
              <div>
                <p className="text-[9px] font-black text-secondary uppercase tracking-widest mb-1 opacity-60">
                  {lang === 'th' ? 'งบประมาณทั้งหมด' : 'Monthly Budget'}
                </p>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums">{fmt(limitTotal)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Insight (Compact & Glassy) */}
        {aiInsight && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 dark:bg-white/2 rounded-[28px] p-5 border border-primary/10 dark:border-white/5 flex items-center gap-4 backdrop-blur-sm"
          >
            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-inner">
              <BrainCircuit size={24} strokeWidth={1.5} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">AI Analysis</h4>
              <p className="text-xs font-bold text-slate-700 dark:text-white/80 leading-relaxed line-clamp-2">
                {aiInsight.summary}
              </p>
            </div>
          </motion.section>
        )}

        {/* Spending Trend Line Chart (Ref: Dribbble Middle) */}
        <section className="bg-white dark:bg-[#121214] rounded-[32px] p-6 border border-border/40 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-1">
                Spending Trend
              </h3>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {lang === 'th' ? 'เปรียบเทียบรับ - จ่าย' : 'Income vs Expense'}
                </p>
              </div>
            </div>
            <div className="flex bg-slate-100/50 dark:bg-white/5 p-1 rounded-xl border border-border/20 dark:border-white/5">
              {(['expense', 'income', 'compare'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDataType(t)}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all relative ${
                    dataType === t ? 'text-primary' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {dataType === t && (
                    <motion.div
                      layoutId="activeChartDataType"
                      className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{t === 'expense' ? 'Exp' : t === 'income' ? 'Inc' : 'All'}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 -mx-2">
            <MainChart data={chartEntries} type="Line" isDark={isDark} dataType={dataType} />
          </div>
        </section>

        {/* Categories Breakdown Horizontal Bars (Ref: Dribbble Bottom) */}
        <section className="bg-white dark:bg-[#121214] rounded-[32px] p-6 border border-border/40 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-1">
                Categories
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {lang === 'th' ? 'การใช้จ่ายแยกตามหมวดหมู่' : 'Expense Breakdown'}
              </p>
            </div>
            <div className="size-10 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 border border-border/20 dark:border-white/5">
              <BarChart3 size={18} />
            </div>
          </div>

          <div className="space-y-6">
            {expenseByCategory.length > 0 ? (
              expenseByCategory.slice(0, 8).map((cat) => {
                const ratio = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;

                return (
                  <div key={cat.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-9 flex items-center justify-center rounded-xl transition-transform hover:scale-110"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                          }}
                        >
                          {ICONS[cat.iconName] || <Receipt size={18} />}
                        </div>
                        <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight">
                          {cat.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                          {fmt(cat.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${ratio}%` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: cat.color,
                            boxShadow: `0 0 12px ${cat.color}40`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 w-8 text-right tabular-nums">
                        {ratio.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-white/2 rounded-3xl border border-dashed border-border/40">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No data available</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function CircularProgress({
  percentage,
  color,
  size,
  strokeWidth,
}: Readonly<{
  percentage: number;
  color: string;
  size: number;
  strokeWidth: number;
}>) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-100 dark:text-white/5"
      />
      {/* Progress track */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 10px ${color}50)`,
        }}
      />
    </svg>
  );
}

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

function MainChart({
  data,
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

  const datasets = [];

  if (dataType === 'income' || dataType === 'compare') {
    datasets.push({
      label: 'รายรับ',
      data: incomeData,
      borderColor: '#7A36FF',
      backgroundColor: (context: any) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(122, 54, 255, 0.1)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(122, 54, 255, 0.15)');
        gradient.addColorStop(1, 'rgba(122, 54, 255, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.45,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 3,
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#7A36FF',
    });
  }

  if (dataType === 'expense' || dataType === 'compare') {
    datasets.push({
      label: 'รายจ่าย',
      data: expenseData,
      borderColor: '#FF6A39',
      backgroundColor: (context: any) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(255, 106, 57, 0.1)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(255, 106, 57, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 106, 57, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.45,
      borderWidth: 3,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 3,
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#FF6A39',
    });
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    isDark,
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

  return <Line data={{ labels, datasets }} options={options} plugins={[lineGlowPlugin, hoverLinePlugin]} />;
}
