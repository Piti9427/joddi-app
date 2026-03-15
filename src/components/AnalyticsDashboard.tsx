import React, { useMemo, useState } from 'react';
import { ViewState, Transaction } from '../App';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, BarChart3, LineChart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ChartType = 'Bar' | 'Line';

export function AnalyticsDashboard({ onNavigate, transactions }: { onNavigate: (v: ViewState) => void, transactions: Transaction[] }) {
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Month');
  const [chartType, setChartType] = useState<ChartType>('Bar');

  const { totalIncome, totalExpense, chartEntries, netBalance } = useMemo(() => {
    const now = new Date();
    let income = 0;
    let expense = 0;
    
    // 1. Pre-fill chart map to ensure consistent X-axis
    const chartMap: { [key: string]: { income: number, expense: number } } = {};
    const orderedKeys: string[] = [];

    if (timeRange === 'Week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-US', { weekday: 'short' });
        orderedKeys.push(key);
        chartMap[key] = { income: 0, expense: 0 };
      }
    } else if (timeRange === 'Month') {
      ['W1', 'W2', 'W3', 'W4', 'W5'].forEach(w => {
        orderedKeys.push(w);
        chartMap[w] = { income: 0, expense: 0 };
      });
    } else if (timeRange === 'Year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(m => {
        orderedKeys.push(m);
        chartMap[m] = { income: 0, expense: 0 };
      });
    }

    // 2. Filter transactions based on timeRange
    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      if (timeRange === 'Week') {
        const weekAgo = new Date();
        weekAgo.setHours(0,0,0,0);
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

    // 3. Populate metrics
    filtered.forEach(t => {
      if (t.type === 'Income') income += t.amount;
      else expense += t.amount;

      let key = '';
      const d = new Date(t.date);
      
      if (timeRange === 'Week') {
        key = d.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (timeRange === 'Month') {
        // Simple week grouping 1-7 = W1, etc.
        const dayOfMonth = d.getDate();
        const weekNum = Math.ceil(dayOfMonth / 7);
        key = `W${Math.min(weekNum, 5)}`; // Cap at W5
      } else if (timeRange === 'Year') {
        key = d.toLocaleDateString('en-US', { month: 'short' });
      }

      if (chartMap[key]) {
        if (t.type === 'Income') chartMap[key].income += t.amount;
        else chartMap[key].expense += t.amount;
      }
    });

    const entries = orderedKeys.map(k => [k, chartMap[k]] as [string, { income: number, expense: number }]);

    return {
      totalIncome: income,
      totalExpense: expense,
      chartEntries: entries,
      netBalance: income - expense
    };
  }, [transactions, timeRange]);

  const fmt = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex flex-col min-h-full pb-32 relative bg-slate-50 dark:bg-background-dark">
      <header className="bg-white dark:bg-surface-dark px-6 pt-6 pb-4 sticky top-0 z-20 shadow-sm border-b border-border dark:border-slate-800">
        <h1 className="text-2xl font-black tracking-tight text-text-dark dark:text-white mb-4">Cashflow</h1>
        
        {/* Apple/Finance App Style Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 relative">
          {(['Week', 'Month', 'Year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-1.5 text-xs font-black uppercase tracking-widest transition-all relative z-10 ${timeRange === range ? 'text-text-dark dark:text-slate-900' : 'text-secondary opacity-60 hover:opacity-100'}`}
            >
              {range}
            </button>
          ))}
          {/* Active indicator sliding background */}
          <div className="absolute inset-1 pointer-events-none flex">
             <div className="flex-1 flex items-center justify-center relative">
               <motion.div 
                 layoutId="timeRangeBg" 
                 transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                 className="absolute w-full h-full bg-white dark:bg-white rounded-lg shadow-sm"
                 style={{
                   left: timeRange === 'Week' ? '0%' : timeRange === 'Month' ? '100%' : '200%'
                 }}
               />
             </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6 mt-2">
        
        {/* Net Balance & Chart Section */}
        <section className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-6 shadow-sm border border-border dark:border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Net Flow</p>
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

          <div className="h-[220px] w-full">
             <AnimatePresence mode="wait">
                <motion.div 
                  key={chartType + timeRange} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {chartType === 'Bar' ? <BarChart entries={chartEntries} fmt={fmt} /> : <TrendChart entries={chartEntries} fmt={fmt} />}
                </motion.div>
             </AnimatePresence>
          </div>
          
          <div className="flex justify-center gap-6 mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-2">
              <span className="size-2.5 bg-primary rounded-full"></span>
              <span className="text-[10px] font-bold text-secondary uppercase">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 bg-expense rounded-full"></span>
              <span className="text-[10px] font-bold text-secondary uppercase">Expense</span>
            </div>
          </div>
        </section>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800"
          >
            <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-primary flex items-center justify-center mb-4">
              <ArrowUpRight size={20} />
            </div>
            <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Total Income</p>
            <p className="text-xl font-black text-text-dark dark:text-white">{fmt(totalIncome)}</p>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800"
          >
            <div className="size-10 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-expense flex items-center justify-center mb-4">
              <ArrowDownRight size={20} />
            </div>
            <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Total Expense</p>
            <p className="text-xl font-black text-text-dark dark:text-white">{fmt(totalExpense)}</p>
          </motion.div>
        </div>

      </main>
    </div>
  );
}

/* ── Pro-Level Standardized Charts ── */

const formatYAxis = (val: number) => {
  if (val >= 1000) return `$${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
  return `$${val}`;
};

function BarChart({ entries, fmt }: any) {
  const maxVal = Math.max(...entries.map(([, v]: any) => Math.max(v.income, v.expense)), 100); // minimum scale 100
  const ticks = [maxVal, maxVal * 0.5, 0];

  return (
    <div className="relative h-full flex flex-col pt-2">
      {/* Y-Axis Grid Background */}
      <div className="absolute inset-0 flex flex-col justify-between pb-6 pointer-events-none z-0">
         {ticks.map((tick, i) => (
           <div key={i} className={`flex-1 border-t border-slate-100 dark:border-slate-800 flex items-start ${i === 2 ? 'border-none' : ''}`}>
             <span className="text-[9px] text-secondary opacity-40 font-bold -mt-3 bg-white dark:bg-surface-dark px-1">{formatYAxis(tick)}</span>
           </div>
         ))}
      </div>

      {/* Bars Layer */}
      <div className="flex-1 flex justify-between items-end pb-6 z-10 px-2 sm:px-4">
        {entries.map(([key, val]: any, i: number) => (
          <div key={i} className="flex flex-col items-center h-full w-full justify-end group">
            <div className="flex items-end justify-center w-full h-full pb-0 gap-0.5 sm:gap-1">
              {/* Income Bar */}
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: `${(val.income / maxVal) * 100}%` }} 
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="w-1.5 sm:w-2.5 bg-primary rounded-t-sm"
                style={{ minHeight: val.income > 0 ? '4px' : '0' }}
              />
              {/* Expense Bar */}
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: `${(val.expense / maxVal) * 100}%` }} 
                transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.1 }}
                className="w-1.5 sm:w-2.5 bg-expense rounded-t-sm"
                style={{ minHeight: val.expense > 0 ? '4px' : '0' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* X-Axis Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 sm:px-4">
         {entries.map(([key]: any, i: number) => (
           <div key={i} className="flex-1 text-center">
             <span className="text-[9px] font-bold text-secondary uppercase opacity-60">
               {key.length > 3 ? key.substring(0,3) : key}
             </span>
           </div>
         ))}
      </div>
    </div>
  );
}

function TrendChart({ entries }: any) {
  const maxV = Math.max(...entries.map(([, v]: any) => Math.max(v.income, v.expense)), 100);
  const width = 1000;
  const height = 400;
  
  const getPoints = (key: 'income' | 'expense') => {
    return entries.map(([, v]: any, i: number) => ({
      x: (i / (entries.length - 1 || 1)) * width,
      y: height - (v[key] / maxV) * height
    }));
  };

  const incPoints = getPoints('income');
  const expPoints = getPoints('expense');

  // Curve smoothing function (Catmull-Rom to Cubic Bezier)
  const spline = (points: {x:number, y:number}[]) => {
    if(points.length === 0) return '';
    if(points.length === 1) return `M ${points[0].x},${points[0].y}`;
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[0];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i != points.length - 2 ? points[i + 2] : p2;
        
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        
        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const ticks = [maxV, maxV * 0.5, 0];

  return (
    <div className="relative h-full flex flex-col pt-2">
      {/* Y-Axis Grid Background (HTML) */}
      <div className="absolute inset-0 flex flex-col justify-between pb-6 pointer-events-none z-0">
         {ticks.map((tick, i) => (
           <div key={i} className={`flex-1 border-t border-slate-100 dark:border-slate-800 flex items-start ${i === 2 ? 'border-none' : ''}`}>
             <span className="text-[9px] text-secondary opacity-40 font-bold -mt-3 bg-white dark:bg-surface-dark px-1">{formatYAxis(tick)}</span>
           </div>
         ))}
      </div>

      <div className="flex-1 w-full relative z-10 pb-6 overflow-visible">
        <svg viewBox={`0 -10 ${width} ${height + 20}`} preserveAspectRatio="none" className="size-full overflow-visible">
          {/* Defs for Glow */}
          <defs>
             <filter id="glowInc" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur stdDeviation="15" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
             </filter>
             <filter id="glowExp" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur stdDeviation="15" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
             </filter>
          </defs>
          
          <motion.path 
            d={spline(incPoints)} 
            fill="none" 
            stroke="var(--primary)" 
            strokeWidth="8" 
            strokeLinecap="round" 
            filter="url(#glowInc)"
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 1.5, ease: 'easeInOut' }} 
          />
          <motion.path 
            d={spline(expPoints)} 
            fill="none" 
            stroke="var(--expense)" 
            strokeWidth="8" 
            strokeLinecap="round" 
            filter="url(#glowExp)"
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }} 
          />
        </svg>
      </div>
      
      {/* X-Axis Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 sm:px-4">
         {entries.map(([key]: any, i: number) => (
           <div key={i} className="flex-1 text-center">
             <span className="text-[9px] font-bold text-secondary uppercase opacity-60">
               {key.length > 3 ? key.substring(0,3) : key}
             </span>
           </div>
         ))}
      </div>
    </div>
  );
}
