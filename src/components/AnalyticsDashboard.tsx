import React, { useMemo, useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ViewState, Transaction } from '../App';
import { ArrowUpRight, ArrowDownRight, BarChart3, BrainCircuit, LineChart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLocalAiInsight } from '../lib/aiInsights';
import { formatMoney } from '../lib/formatters';

type ChartType = 'Bar' | 'Line';
const RANGE_LABELS = {
  Week: 'สัปดาห์',
  Month: 'เดือน',
  Year: 'ปี',
} as const;

const CATEGORY_COLORS = [
  '#3b82f6', // Blue 500
  '#ef4444', // Red 500
  '#10b981', // Emerald 500
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
  onNavigate: (v: ViewState) => void;
  transactions: Transaction[];
}>) {
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Month');
  const [chartType, setChartType] = useState<ChartType>('Bar');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // Sync theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const { totalIncome, totalExpense, chartEntries, netBalance, savingsRate, expenseByCategory, aiInsight } =
    useMemo(() => {
      const now = new Date();
      let income = 0;
      let expense = 0;

      const chartMap: { [key: string]: { income: number; expense: number } } = {};
      const orderedKeys: string[] = [];
      const catMap: { [key: string]: number } = {};

      if (timeRange === 'Week') {
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
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
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        months.forEach((m) => {
          orderedKeys.push(m);
          chartMap[m] = { income: 0, expense: 0 };
        });
      }

      const filtered = transactions.filter((t) => {
        const tDate = new Date(t.date);
        if (timeRange === 'Week') {
          const weekAgo = new Date();
          weekAgo.setHours(0, 0, 0, 0);
          weekAgo.setDate(now.getDate() - 6);
          return tDate >= weekAgo;
        }
        if (timeRange === 'Month') {
          return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        }
        if (timeRange === 'Year') {
          return tDate.getFullYear() === now.getFullYear();
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
        netBalance: income - expense,
        savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
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
        <div className="flex items-end justify-between mb-4">
          <h1 className="text-2xl font-black text-text-dark dark:text-white">วิเคราะห์เงินสด</h1>
          <p className="text-[11px] font-semibold text-secondary opacity-80">มุมมอง{RANGE_LABELS[timeRange]}</p>
        </div>

        <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
          {(['Week', 'Month', 'Year'] as const).map((range) => {
            const active = timeRange === range;
            return (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`relative py-1.5 text-xs font-extrabold transition-all ${active ? 'text-text-dark dark:text-slate-900' : 'text-secondary opacity-70'}`}
              >
                {active && (
                  <motion.span
                    layoutId="time-range-pill"
                    className="absolute inset-0 rounded-lg bg-white dark:bg-white shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                  />
                )}
                <span className="relative z-10">{RANGE_LABELS[range]}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="p-4 space-y-4 mt-1">
        <section className="ai-surface bg-white dark:bg-surface-dark rounded-[1.5rem] p-4 shadow-sm border border-border dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="size-11 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shrink-0">
              <BrainCircuit size={21} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-1 text-[10px] font-extrabold">
                  <Sparkles size={11} />
                  ผู้ช่วย AI
                </span>
                <span className="text-[10px] font-bold text-secondary">
                  สัญญาณ {Math.round(aiInsight.confidence * 100)}%
                </span>
              </div>
              <h2 className="text-base font-extrabold text-text-dark dark:text-white leading-snug">
                {aiInsight.title}
              </h2>
              <p className="text-xs font-medium text-secondary leading-relaxed mt-1">{aiInsight.summary}</p>
            </div>
          </div>
        </section>

        {/* Net Balance & Chart Section */}
        <section className="bg-white dark:bg-surface-dark rounded-[1.5rem] p-5 shadow-sm border border-border dark:border-slate-800">
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-[11px] font-semibold text-secondary mb-1">เงินสุทธิ</p>
              <h2 className="text-3xl font-black text-text-dark dark:text-white">{fmt(netBalance)}</h2>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5">
              <button
                onClick={() => setChartType('Bar')}
                className={`p-1.5 rounded-lg transition-all ${chartType === 'Bar' ? 'bg-white dark:bg-slate-800 shadow-sm text-text-dark dark:text-white' : 'text-secondary/60'}`}
              >
                <BarChart3 size={16} />
              </button>
              <button
                onClick={() => setChartType('Line')}
                className={`p-1.5 rounded-lg transition-all ${chartType === 'Line' ? 'bg-white dark:bg-slate-800 shadow-sm text-text-dark dark:text-white' : 'text-secondary/60'}`}
              >
                <LineChart size={16} />
              </button>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <MainApexChart entries={chartEntries} type={chartType} isDark={isDark} />
          </div>
        </section>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-surface-dark rounded-[1.35rem] p-4 shadow-sm border border-border dark:border-slate-800"
          >
            <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-primary flex items-center justify-center mb-4">
              <ArrowUpRight size={20} />
            </div>
            <p className="text-[11px] font-semibold text-secondary mb-1">รายรับรวม</p>
            <p className="text-xl font-black text-text-dark dark:text-white">{fmt(totalIncome)}</p>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-surface-dark rounded-[1.35rem] p-4 shadow-sm border border-border dark:border-slate-800"
          >
            <div className="size-10 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-expense flex items-center justify-center mb-4">
              <ArrowDownRight size={20} />
            </div>
            <p className="text-[11px] font-semibold text-secondary mb-1">รายจ่ายรวม</p>
            <p className="text-xl font-black text-text-dark dark:text-white">{fmt(totalExpense)}</p>
          </motion.div>
        </div>

        {/* ── Donut Chart: Expense Breakdown ── */}
        <section className="bg-white dark:bg-surface-dark rounded-[1.5rem] p-5 shadow-sm border border-border dark:border-slate-800">
          <p className="text-[11px] font-semibold text-secondary mb-5">สัดส่วนรายจ่าย</p>
          {expenseByCategory.length === 0 ? (
            <div className="text-center py-10 text-secondary text-sm font-bold opacity-60">
              ยังไม่มีข้อมูลรายจ่ายในช่วงนี้
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-1/2 flex justify-center">
                <DonutApexChart data={expenseByCategory} isDark={isDark} />
              </div>
              <div className="flex-1 w-full space-y-2.5 min-w-0">
                {expenseByCategory.slice(0, 5).map((cat) => {
                  const pct = totalExpense > 0 ? ((cat.amount / totalExpense) * 100).toFixed(1) : '0';
                  return (
                    <div key={cat.name} className="flex items-center gap-2.5">
                      <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs font-bold text-text-dark dark:text-white truncate flex-1">
                        {cat.name}
                      </span>
                      <span className="text-[11px] font-black text-secondary tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
                {expenseByCategory.length > 5 && (
                  <p className="text-[10px] text-secondary font-bold opacity-60">
                    เพิ่มอีก {expenseByCategory.length - 5} หมวด
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ── Main Chart Component ── */
function MainApexChart({ entries, type, isDark }: any) {
  const categories = entries.map(([k]: any) => k);
  const incomeData = entries.map(([, v]: any) => v.income);
  const expenseData = entries.map(([, v]: any) => v.expense);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: type === 'Bar' ? 'bar' : 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, system-ui, sans-serif',
      background: 'transparent',
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
    stroke: {
      show: true,
      width: type === 'Bar' ? 0 : 3.5,
      curve: 'smooth',
      lineCap: 'round',
    },
    colors: ['#10b981', '#ef4444'],
    fill: {
      type: type === 'Bar' ? 'solid' : 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0,
        stops: [0, 95],
      },
    },
    grid: {
      borderColor: isDark ? '#1e293b' : '#f1f5f9',
      strokeDashArray: 6,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 0, bottom: 0, left: 10 },
    },
    markers: {
      size: 0,
      hover: { size: 6, sizeOffset: 3 },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '10px',
          fontWeight: 600,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '10px',
          fontWeight: 600,
        },
        formatter: (val) => formatMoney(val, { compact: true, maximumFractionDigits: 1 }),
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val) => formatMoney(val),
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        borderRadiusApplication: 'end',
        columnWidth: '55%',
        dataLabels: { position: 'top' },
      },
    },
  };

  const series = [
    { name: 'รายรับ', data: incomeData },
    { name: 'รายจ่าย', data: expenseData },
  ];

  return (
    <Chart
      options={options}
      series={series}
      type={type === 'Bar' ? 'bar' : 'area'}
      height="100%"
      width="100%"
    />
  );
}

/* ── Donut Chart Component ── */
function DonutApexChart({ data, isDark }: any) {
  const labels = data.map((d: any) => d.name);
  const series = data.map((d: any) => d.amount);
  const colors = data.map((d: any) => d.color);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, system-ui, sans-serif',
      background: 'transparent',
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
    colors,
    stroke: { show: false },
    dataLabels: { enabled: false },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'รวม',
              fontSize: '12px',
              fontWeight: 600,
              color: '#94a3b8',
              formatter: (w) => {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return formatMoney(total, { compact: true, maximumFractionDigits: 1 });
              },
            },
            value: {
              fontSize: '16px',
              fontWeight: 900,
              color: isDark ? '#fff' : '#0f172a',
            },
          },
        },
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: {
        formatter: (val) => formatMoney(val),
      },
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="donut"
      width={240}
    />
  );
}
