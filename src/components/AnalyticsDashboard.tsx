import React, { useState, useMemo } from 'react';
import { ArrowLeft, PieChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

  // === REAL BAR CHART DATA ===
  const chartData = useMemo(() => {
    const now = new Date();

    if (timeRange === 'week') {
      // Last 7 days
      const days: { label: string, expense: number, income: number }[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toDateString();
        let exp = 0, inc = 0;
        filteredTransactions.forEach(t => {
          if (new Date(t.date).toDateString() === dayStr) {
            if (t.type === 'Expense') exp += t.amount;
            else inc += t.amount;
          }
        });
        days.push({ label: dayNames[d.getDay()], expense: exp, income: inc });
      }
      return days;
    } else if (timeRange === 'month') {
      // Group by week of the month (Week 1-5)
      const weeks: { label: string, expense: number, income: number }[] = [];
      for (let w = 0; w < 5; w++) {
        let exp = 0, inc = 0;
        filteredTransactions.forEach(t => {
          const d = new Date(t.date);
          const weekOfMonth = Math.floor((d.getDate() - 1) / 7);
          if (weekOfMonth === w) {
            if (t.type === 'Expense') exp += t.amount;
            else inc += t.amount;
          }
        });
        weeks.push({ label: `W${w + 1}`, expense: exp, income: inc });
      }
      return weeks;
    } else {
      // Group by month
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const months: { label: string, expense: number, income: number }[] = [];
      for (let m = 0; m < 12; m++) {
        let exp = 0, inc = 0;
        filteredTransactions.forEach(t => {
          const d = new Date(t.date);
          if (d.getMonth() === m) {
            if (t.type === 'Expense') exp += t.amount;
            else inc += t.amount;
          }
        });
        months.push({ label: monthNames[m], expense: exp, income: inc });
      }
      return months;
    }
  }, [filteredTransactions, timeRange]);

  const maxValue = Math.max(...chartData.map(d => Math.max(d.expense, d.income)), 1);
  const netFlow = totalIncome - totalExpense;

  const colors = ['bg-expense', 'bg-expense/70', 'bg-amber-500', 'bg-amber-400', 'bg-amber-300'];

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
        
        {/* Real Bar Chart */}
        <section className="bg-surface dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-border dark:border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-text-dark dark:text-slate-100">Spending Overview</h3>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1"><div className="size-2.5 rounded-full bg-expense"></div><span className="text-secondary">Expense</span></div>
              <div className="flex items-center gap-1"><div className="size-2.5 rounded-full bg-income"></div><span className="text-secondary">Income</span></div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-secondary">
              <Minus size={32} className="mb-2 opacity-40" />
              <p className="text-sm font-bold">No data for this period</p>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-1 h-36 w-full">
                {chartData.map((d, i) => {
                  const expH = maxValue > 0 ? (d.expense / maxValue) * 100 : 0;
                  const incH = maxValue > 0 ? (d.income / maxValue) * 100 : 0;
                  const isToday = timeRange === 'week' && i === chartData.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                      <div className="flex gap-0.5 items-end h-28 w-full justify-center">
                        {/* Income bar */}
                        <div 
                          className={`rounded-t-md transition-all duration-500 ${isToday ? 'bg-income shadow-md shadow-income/20' : 'bg-income/60 dark:bg-income/40'}`} 
                          style={{ height: `${Math.max(incH, 2)}%`, width: chartData.length > 8 ? '35%' : '40%', minHeight: d.income > 0 ? 4 : 0 }}
                          title={`Income: $${d.income.toFixed(0)}`}
                        ></div>
                        {/* Expense bar */}
                        <div 
                          className={`rounded-t-md transition-all duration-500 ${isToday ? 'bg-expense shadow-md shadow-expense/20' : 'bg-expense/60 dark:bg-expense/40'}`} 
                          style={{ height: `${Math.max(expH, 2)}%`, width: chartData.length > 8 ? '35%' : '40%', minHeight: d.expense > 0 ? 4 : 0 }}
                          title={`Expense: $${d.expense.toFixed(0)}`}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={`flex w-full mt-2 text-[10px] font-bold text-secondary ${chartData.length > 8 ? 'gap-0' : 'gap-1'}`}>
                {chartData.map((d, i) => {
                  const isToday = timeRange === 'week' && i === chartData.length - 1;
                  return (
                    <div key={i} className={`flex-1 text-center truncate ${isToday ? 'text-primary' : ''}`}>{d.label}</div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 bg-text-dark dark:bg-surface-dark rounded-3xl p-6 shadow-lg text-white flex flex-col items-center justify-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60">Net Balance</p>
            <p className={`text-4xl font-extrabold tracking-tight ${netFlow >= 0 ? 'text-income' : 'text-expense'}`}>
              {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
            </p>
            <div className="flex items-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                 <div className="size-2 rounded-full bg-income"></div>
                 <span className="text-[10px] font-bold opacity-60 uppercase">Savings Rate: {totalIncome > 0 ? ((netFlow / totalIncome) * 100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-surface dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-border dark:border-slate-800 flex flex-col gap-1">
            <div className="size-8 rounded-full bg-income-bg/60 dark:bg-income/10 flex items-center justify-center mb-1 text-income">
              <TrendingUp size={16} />
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Total Income</p>
            <p className="text-sm font-bold text-text-dark dark:text-white">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-surface dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-border dark:border-slate-800 flex flex-col gap-1">
            <div className="size-8 rounded-full bg-expense-bg/60 dark:bg-expense/10 flex items-center justify-center mb-1 text-expense">
              <TrendingDown size={16} />
            </div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Total Expense</p>
            <p className="text-sm font-bold text-text-dark dark:text-white">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Top Spending Categories */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-text-dark dark:text-slate-100 flex items-center gap-2">
            <PieChart size={18} className="text-expense" />
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
        <div className="text-right">
          <p className="font-bold text-sm text-text-dark dark:text-slate-100">{formatCurrency(amount)}</p>
          <p className="text-[10px] font-bold text-secondary">{percent.toFixed(1)}%</p>
        </div>
      </div>
      <div className="h-2.5 w-full bg-input-bg dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
