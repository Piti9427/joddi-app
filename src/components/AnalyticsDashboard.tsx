import React, { useMemo, useState } from 'react';
import { ViewState, Transaction } from '../App';
import { TrendingUp, TrendingDown, Filter, BarChart3, Wallet, Target, Info } from 'lucide-react';

export function AnalyticsDashboard({ onNavigate, transactions }: { onNavigate: (v: ViewState) => void, transactions: Transaction[] }) {
  const [timeRange, setTimeRange] = useState<'Week' | 'Month' | 'Year'>('Month');

  const { totalIncome, totalExpense, chartData, topCategories, netBalance, savingsRate } = useMemo(() => {
    const now = new Date();
    let income = 0;
    let expense = 0;
    const catMap: { [key: string]: number } = {};
    const chartMap: { [key: string]: { income: number, expense: number } } = {};

    // Filter by time range
    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      if (timeRange === 'Week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
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

    filtered.forEach(t => {
      if (t.type === 'Income') income += t.amount;
      else {
        expense += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }

      // Grouping for chart
      let key = '';
      const d = new Date(t.date);
      if (timeRange === 'Week') key = d.toLocaleDateString([], { weekday: 'short' });
      else if (timeRange === 'Month') key = `W${Math.ceil(d.getDate() / 7)}`;
      else key = d.toLocaleDateString([], { month: 'short' });

      if (!chartMap[key]) chartMap[key] = { income: 0, expense: 0 };
      if (t.type === 'Income') chartMap[key].income += t.amount;
      else chartMap[key].expense += t.amount;
    });

    const topCats = Object.entries(catMap)
      .map(([name, val]) => ({ name, val, percent: (val / (expense || 1)) * 100 }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);

    const net = income - expense;
    const rate = income > 0 ? (net / income) * 100 : 0;

    return { 
      totalIncome: income, 
      totalExpense: expense, 
      chartData: chartMap, 
      topCategories: topCats,
      netBalance: net,
      savingsRate: rate
    };
  }, [transactions, timeRange]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex flex-col min-h-full pb-32 relative bg-slate-50 dark:bg-background-dark">
      {/* Dynamic Header */}
      <header className="flex items-center bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md p-4 border-b border-border dark:border-slate-800 sticky top-0 z-20">
        <div className="size-10 shrink-0"></div>
        <div className="flex-1 text-center">
           <h1 className="text-lg font-black tracking-tight text-text-dark dark:text-white">Financial Insights</h1>
           <p className="text-[10px] font-bold text-secondary uppercase tracking-widest leading-none mt-1">Real-time analysis</p>
        </div>
        <button className="text-secondary hover:text-primary transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
          <Filter size={18} />
        </button>
      </header>

      {/* Time Range Selector */}
      <div className="flex p-4 gap-2 bg-white dark:bg-surface-dark border-b border-border dark:border-slate-800">
        {(['Week', 'Month', 'Year'] as const).map(range => (
          <button 
            key={range}
            onClick={() => setTimeRange(range)}
            className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${timeRange === range ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-secondary hover:bg-slate-100'}`}
          >
            {range}
          </button>
        ))}
      </div>

      <main className="p-4 space-y-6">
        
        {/* Main Scorecard */}
        <div className="grid grid-cols-2 gap-4">
          <section className="col-span-2 bg-white dark:bg-surface-dark rounded-[2.5rem] p-6 shadow-sm border border-border dark:border-slate-800 overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 text-emerald-500/10 dark:text-emerald-500/5 rotate-12">
               <TrendingUp size={160} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                 <Wallet size={16} className="text-primary" />
                 <p className="text-secondary text-[10px] font-black uppercase tracking-widest">Net Savings</p>
              </div>
              <h2 className={`text-3xl font-black tracking-tight ${netBalance >= 0 ? 'text-primary' : 'text-expense'}`}>
                {formatCurrency(netBalance)}
              </h2>
              <div className="flex items-center gap-2 mt-4">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full">
                   SAVINGS RATE: {savingsRate.toFixed(1)}%
                </span>
                {savingsRate > 20 && <span className="text-xs">Amazing job! 🚀</span>}
              </div>
            </div>
          </section>

          <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800">
             <div className="flex items-center gap-2 mb-2 text-income">
               <TrendingUp size={14} />
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Income</p>
             </div>
             <p className="text-lg font-black text-text-dark dark:text-white tabular-nums">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800">
             <div className="flex items-center gap-2 mb-2 text-expense">
               <TrendingDown size={14} />
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Expenses</p>
             </div>
             <p className="text-lg font-black text-text-dark dark:text-white tabular-nums">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Charts Section */}
        <section className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-6 shadow-sm border border-border dark:border-slate-800">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-dark dark:text-white flex items-center gap-2">
               <BarChart3 size={18} className="text-primary" />
               Dynamics
            </h3>
            <div className="flex gap-2">
               <div className="flex items-center gap-1">
                 <span className="size-2 bg-primary rounded-full"></span>
                 <span className="text-[8px] font-bold text-secondary uppercase">Inc</span>
               </div>
               <div className="flex items-center gap-1">
                 <span className="size-2 bg-rose-400 rounded-full"></span>
                 <span className="text-[8px] font-bold text-secondary uppercase">Exp</span>
               </div>
            </div>
          </div>
          
          <div className="h-48 flex items-end gap-3 px-2">
            {(Object.entries(chartData) as [string, { income: number, expense: number }][]).map(([key, val]) => {
              const allValues = Object.values(chartData) as { income: number, expense: number }[];
              const max = Math.max(...allValues.map(v => Math.max(v.income, v.expense || 1)));
              const incH = max > 0 ? (val.income / max) * 100 : 0;
              const expH = max > 0 ? (val.expense / max) * 100 : 0;
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end gap-1 h-32 relative">
                    <div className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg transition-all group-hover:bg-primary/40" style={{ height: `${incH}%` }}>
                       <div className="absolute bottom-0 w-full bg-primary rounded-t-lg" style={{ height: `20%` }}></div>
                    </div>
                    <div className="w-full bg-rose-400/20 dark:bg-rose-400/10 rounded-t-lg transition-all group-hover:bg-rose-400/40" style={{ height: `${expH}%` }}>
                       <div className="absolute bottom-0 w-full bg-rose-400 rounded-t-lg" style={{ height: `20%` }}></div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-secondary uppercase tracking-tighter opacity-70">{key}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Top Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-text-dark dark:text-white flex items-center gap-2">
               <Target size={18} className="text-primary" />
               Category Spending
            </h3>
          </div>
          
          <div className="space-y-2">
            {topCategories.length === 0 ? (
               <div className="bg-white dark:bg-surface-dark p-10 rounded-[2rem] border border-border dark:border-slate-800 text-center">
                 <Info className="mx-auto text-secondary opacity-30 mb-2" />
                 <p className="text-secondary text-xs font-bold uppercase tracking-widest italic">No data to display</p>
               </div>
            ) : topCategories.map(cat => (
              <div key={cat.name} className="bg-white dark:bg-surface-dark p-4 rounded-3xl border border-border/50 dark:border-slate-800/50 flex flex-col gap-3 shadow-sm hover:translate-x-1 transition-transform cursor-pointer">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="size-2 bg-primary rounded-full"></div>
                    <span className="text-sm font-extrabold text-text-dark dark:text-white">{cat.name}</span>
                  </div>
                  <span className="text-sm font-black text-text-dark dark:text-white">{formatCurrency(cat.val)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${cat.percent}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black text-secondary shrink-0">{cat.percent.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
