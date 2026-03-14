import React, { useState, useMemo } from 'react';
import { ArrowLeft, PieChart, TrendingUp, TrendingDown, AlignLeft, Calendar } from 'lucide-react';
import { ViewState, Transaction } from '../App';

type TimeRange = 'week' | 'month' | 'year';

export function AnalyticsDashboard({ onNavigate, transactions }: { onNavigate: (v: ViewState) => void, transactions: Transaction[] }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const date = new Date(t.date);
      if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      } else if (timeRange === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else {
        return date.getFullYear() === now.getFullYear();
      }
    });
  }, [transactions, timeRange]);

  const { totalIncome, totalExpense, topCategories } = useMemo(() => {
    let inc = 0, exp = 0;
    const catMap: { [key: string]: number } = {};

    filteredTransactions.forEach(t => {
      if (t.type === 'Income') {
        inc += t.amount;
      } else {
        exp += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }
    });

    const sortedCats = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, amount]) => ({
        label,
        amount,
        percent: exp > 0 ? (amount / exp) * 100 : 0
      }));

    return { totalIncome: inc, totalExpense: exp, topCategories: sortedCats };
  }, [filteredTransactions]);

  const colors = ['bg-expense', 'bg-expense/80', 'bg-expense/60', 'bg-expense/40', 'bg-expense/20'];

  return (
    <div className="flex flex-col min-h-full pb-20 relative bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10">
        <button onClick={() => onNavigate('dashboard')} className="text-text-dark dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-input-bg dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-10 text-text-dark dark:text-white">Analytics</h1>
      </header>

      <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 py-3 bg-surface dark:bg-surface-dark border-b border-border dark:border-slate-800">
        <GraphTab label="This Week" active={timeRange === 'week'} onClick={() => setTimeRange('week')} />
        <GraphTab label="This Month" active={timeRange === 'month'} onClick={() => setTimeRange('month')} />
        <GraphTab label="This Year" active={timeRange === 'year'} onClick={() => setTimeRange('year')} />
      </div>

      <main className="p-4 flex flex-col flex-1 space-y-6">
        
        {/* Main Chart Area placeholder */}
        <section className="bg-surface dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-border dark:border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
           <div className="flex items-end gap-2 h-32 w-full justify-between px-2">
             {/* Fake Bar Chart */}
             <div className="w-8 bg-highlight dark:bg-primary/20 rounded-t-md h-[40%]"></div>
             <div className="w-8 bg-highlight dark:bg-primary/20 rounded-t-md h-[60%]"></div>
             <div className="w-8 bg-primary rounded-t-md h-[90%] shadow-lg shadow-primary/20"></div>
             <div className="w-8 bg-input-bg dark:bg-slate-800 rounded-t-md h-[30%]"></div>
             <div className="w-8 bg-highlight dark:bg-primary/20 rounded-t-md h-[50%]"></div>
             <div className="w-8 bg-highlight dark:bg-primary/20 rounded-t-md h-[70%]"></div>
           </div>
           <div className="flex w-full justify-between px-2 mt-4 text-xs font-bold text-secondary">
             <span>Mon</span><span>Tue</span><span className="text-primary">Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
           </div>
        </section>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-border dark:border-slate-800 flex flex-col gap-1">
            <div className="size-8 rounded-full bg-income-bg/60 dark:bg-income/10 flex items-center justify-center mb-1 text-income">
              <TrendingUp size={16} />
            </div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Total Income</p>
            <p className="text-lg font-bold text-text-dark dark:text-white">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-surface dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-border dark:border-slate-800 flex flex-col gap-1">
            <div className="size-8 rounded-full bg-expense-bg/60 dark:bg-expense/10 flex items-center justify-center mb-1 text-expense">
              <TrendingDown size={16} />
            </div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Total Expense</p>
            <p className="text-lg font-bold text-text-dark dark:text-white">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Top Spending Categories */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-text-dark dark:text-slate-100 flex items-center gap-2">
            <PieChart size={18} className="text-primary" />
            Top Spending
          </h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800 space-y-4">
            {topCategories.length === 0 ? (
               <p className="text-center text-sm font-bold text-secondary">No expenses in this period.</p>
            ) : (
              topCategories.map((cat, idx) => (
                <CategoryProgress key={cat.label} label={cat.label} amount={cat.amount} percent={cat.percent} color={colors[idx % colors.length]} />
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

function GraphTab({ label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${active ? 'bg-text-dark text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-transparent text-secondary hover:bg-input-bg dark:hover:bg-slate-800'}`}>
      {label}
    </button>
  );
}

function CategoryProgress({ label, amount, percent, color }: any) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <p className="font-bold text-sm text-text-dark dark:text-slate-100">{label}</p>
        <p className="font-bold text-sm text-text-dark dark:text-slate-100">{formatCurrency(amount)}</p>
      </div>
      <div className="h-2.5 w-full bg-input-bg dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
