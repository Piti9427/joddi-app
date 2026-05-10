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
import { ArrowUpRight, ArrowDownRight, BarChart3, BrainCircuit, LineChart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { getLocalAiInsight } from '../lib/aiInsights';
import { formatMoney } from '../lib/formatters';
import { getDateRangeBoundaries } from '../lib/dateUtils';

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
  '#10b981', // Emerald 500
  '#3b82f6', // Blue 500
  '#ef4444', // Red 500
  '#f59e0b', // Amber 500
  '#8b5cf6', // Violet 500
  '#ec4899', // Pink 500
  '#06b6d4', // Cyan 500
  '#84cc16', // Lime 500
  '#f97316', // Orange 500
  '#6366f1', // Indigo 500
];

export function AnalyticsDashboard({
  onNavigate,
  transactions,
}: Readonly<{
  onNavigate: (v: ViewState, payload?: any) => void;
  transactions: Transaction[];
}>) {
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Month');
  const [chartType, setChartType] = useState<ChartType>('Line');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // Sync theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
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
      if (t.type === 'Income') income += t.amount;
      else {
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
        if (t.type === 'Income') chartMap[key].income += t.amount;
        else chartMap[key].expense += t.amount;
      }
    });

    const entries = orderedKeys.map((k) => [k, chartMap[k]] as [string, { income: number; expense: number }]);
    const expByCat = Object.entries(catMap)
      .map(([name, amount], i) => ({ name, amount, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome: income,
      totalExpense: expense,
      chartEntries: entries,
      expenseByCategory: expByCat,
      aiInsight: getLocalAiInsight(filtered),
    };
  }, [transactions, timeRange]);

  const fmt = (val: number, maximumFractionDigits = 0) =>
    formatMoney(val, {
      maximumFractionDigits,
      minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
    });

  return (
    <div className="flex flex-col min-h-full pb-5 relative bg-slate-50 dark:bg-background-dark">
      <header
        className="bg-white dark:bg-surface-dark px-4 pb-4 sticky top-0 z-20 shadow-sm border-b border-border dark:border-slate-800"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}
      >
        <div className="flex items-center justify-between h-12 mb-4">
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Analytics</h1>
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-slate-600 dark:text-slate-400"
          >
            Done
          </button>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
          {(['Week', 'Month', 'Year'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative ${
                timeRange === r ? 'text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {timeRange === r && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{RANGE_LABELS[r]}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Main Stats */}
        <section className="grid grid-cols-2 gap-3">
          <StatCard label="รายรับ" value={fmt(totalIncome)} type="income" icon={<ArrowUpRight size={18} />} />
          <StatCard label="รายจ่าย" value={fmt(totalExpense)} type="expense" icon={<ArrowDownRight size={18} />} />
        </section>

        {/* AI Insight */}
        {aiInsight && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/10 to-violet-500/10 dark:from-primary/20 dark:to-violet-500/20 rounded-3xl p-5 border border-primary/20 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-primary/20 rounded-xl text-primary">
                <BrainCircuit size={18} strokeWidth={1.5} />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-primary">AI Insight</span>
            </div>
            <h4 className="text-sm font-black text-primary mb-1">{aiInsight.title}</h4>
            <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">
              {aiInsight.summary}
            </p>
            <Sparkles className="absolute -right-2 -bottom-2 text-primary/10" size={80} />
          </motion.section>
        )}

        {/* Trends Chart */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Trends</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Income vs Expense</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              <button
                onClick={() => setChartType('Bar')}
                className={`p-1.5 rounded-md transition-all ${
                  chartType === 'Bar'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <BarChart3 size={16} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setChartType('Line')}
                className={`p-1.5 rounded-md transition-all ${
                  chartType === 'Line'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <LineChart size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="h-64 -mx-2">
            <MainChart data={chartEntries} type={chartType} isDark={isDark} />
          </div>
        </section>

        {/* Categories Breakdown */}
        <section className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">
            Category Breakdown
          </h3>

          <div className="flex flex-col items-center gap-8">
            <div className="relative size-56">
              <DoughnutChart data={expenseByCategory} isDark={isDark} />
            </div>

            <div className="w-full space-y-3">
              {expenseByCategory.length > 0 ? (
                expenseByCategory.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{fmt(cat.amount)}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {((cat.amount / totalExpense) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm font-bold text-slate-400 italic">ไม่มีข้อมูลรายจ่ายในส่วนนี้</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, type, icon }: any) {
  return (
    <div className="bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-sm border border-border dark:border-slate-800">
      <div
        className={`size-8 rounded-xl flex items-center justify-center mb-3 ${
          type === 'income'
            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20'
            : 'bg-red-100 text-red-600 dark:bg-red-500/20'
        }`}
      >
        {React.cloneElement(icon, { strokeWidth: 1.5 })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function MainChart({ data, type, isDark }: any) {
  const labels = data.map((d: any) => d[0]);
  const incomeData = data.map((d: any) => d[1].income);
  const expenseData = data.map((d: any) => d[1].expense);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'รายรับ',
        data: incomeData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: type === 'Line',
        tension: 0.4,
        borderWidth: type === 'Bar' ? 0 : 3,
        pointRadius: 0,
        borderRadius: type === 'Bar' ? 6 : 0,
      },
      {
        label: 'รายจ่าย',
        data: expenseData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: type === 'Line',
        tension: 0.4,
        borderWidth: type === 'Bar' ? 0 : 3,
        pointRadius: 0,
        borderRadius: type === 'Bar' ? 6 : 0,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
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
        ticks: { color: '#94a3b8', font: { size: 10, weight: '600' } },
      },
      y: {
        grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', drawBorder: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 10, weight: '600' },
          callback: (val: any) => formatMoney(val, { compact: true }),
        },
      },
    },
  };

  return type === 'Bar' ? <Bar data={chartData} options={options} /> : <Line data={chartData} options={options} />;
}

function DoughnutChart({ data, isDark }: any) {
  const chartData = {
    labels: data.map((d: any) => d.name),
    datasets: [
      {
        data: data.map((d: any) => d.amount),
        backgroundColor: data.map((d: any) => d.color),
        borderWidth: 0,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
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

  return (
    <div className="relative w-full h-full">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-black text-slate-400 uppercase">รวม</span>
        <span className="text-lg font-black text-slate-900 dark:text-white">
          {formatMoney(
            data.reduce((a: any, b: any) => a + b.amount, 0),
            { compact: true },
          )}
        </span>
      </div>
    </div>
  );
}
