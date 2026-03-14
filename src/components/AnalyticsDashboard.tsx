import React from 'react';
import { ArrowLeft, PieChart, TrendingUp, TrendingDown, AlignLeft, Calendar } from 'lucide-react';
import { ViewState } from '../App';

export function AnalyticsDashboard({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="flex flex-col min-h-full pb-20 relative bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10">
        <button onClick={() => onNavigate('dashboard')} className="text-text-dark dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-input-bg dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-10 text-text-dark dark:text-white">Analytics</h1>
      </header>

      <div className="flex overflow-x-auto no-scrollbar gap-2 px-4 py-3 bg-surface dark:bg-surface-dark border-b border-border dark:border-slate-800">
        <GraphTab label="This Week" active />
        <GraphTab label="This Month" />
        <GraphTab label="This Year" />
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
            <div className="size-8 rounded-full bg-highlight/50 dark:bg-primary/10 flex items-center justify-center mb-1 text-primary">
              <TrendingUp size={16} />
            </div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Total Income</p>
            <p className="text-lg font-bold text-text-dark dark:text-white">{formatCurrency(4200)}</p>
          </div>
          <div className="bg-surface dark:bg-surface-dark rounded-2xl p-4 shadow-sm border border-border dark:border-slate-800 flex flex-col gap-1">
            <div className="size-8 rounded-full bg-input-bg dark:bg-slate-800 flex items-center justify-center mb-1 text-secondary">
              <TrendingDown size={16} />
            </div>
            <p className="text-[11px] font-bold text-secondary uppercase tracking-wider">Total Expense</p>
            <p className="text-lg font-bold text-text-dark dark:text-white">{formatCurrency(1240)}</p>
          </div>
        </div>

        {/* Top Spending Categories */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-text-dark dark:text-slate-100 flex items-center gap-2">
            <PieChart size={18} className="text-primary" />
            Top Spending
          </h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800 space-y-4">
            
            <CategoryProgress label="Food & Dining" amount={450} percent={65} color="bg-primary" />
            <CategoryProgress label="Transport" amount={120} percent={25} color="bg-secondary" />
            <CategoryProgress label="Shopping" amount={80} percent={15} color="bg-grass dark:bg-grass/60" />

          </div>
        </section>

      </main>
    </div>
  );
}

function GraphTab({ label, active }: any) {
  return (
    <button className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${active ? 'bg-text-dark text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-transparent text-secondary hover:bg-input-bg dark:hover:bg-slate-800'}`}>
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
