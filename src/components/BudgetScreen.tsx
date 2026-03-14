import React from 'react';
import { ArrowLeft, Target, Plus } from 'lucide-react';
import { ViewState } from '../App';

export function BudgetScreen({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex flex-col min-h-full pb-20 relative bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10">
        <button onClick={() => onNavigate('dashboard')} className="text-text-dark dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-input-bg dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-2 text-text-dark dark:text-white">Budgets</h1>
        <button className="text-primary hover:text-text-dark transition-colors p-2 bg-highlight dark:bg-primary/20 rounded-full">
          <Plus size={20} />
        </button>
      </header>

      <main className="p-4 flex flex-col flex-1 space-y-6">
        
        {/* Overall Monthly Budget */}
        <section className="bg-primary rounded-3xl p-6 shadow-xl shadow-primary/20 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-white/10">
            <Target size={120} />
          </div>
          <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-2 relative z-10">October Budget</p>
          <div className="flex items-end gap-2 mb-6 relative z-10">
            <h2 className="text-4xl font-extrabold tracking-tight">{formatCurrency(1240)}</h2>
            <p className="text-white/60 text-lg font-medium mb-1">/ {formatCurrency(3000)}</p>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span>{formatCurrency(1760)} left</span>
              <span>41%</span>
            </div>
            <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-white rounded-full shadow-sm" style={{ width: '41%' }}></div>
            </div>
          </div>
        </section>

        {/* Category Limits */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-text-dark dark:text-slate-100">Category Limits</h3>
          <div className="space-y-3">
            <BudgetCard label="Food & Dining" spent={450} limit={600} icon="🍔" />
            <BudgetCard label="Shopping" spent={380} limit={400} icon="🛍️" warning />
            <BudgetCard label="Transport" spent={120} limit={300} icon="🚗" />
            <BudgetCard label="Entertainment" spent={290} limit={200} icon="🍿" over />
          </div>
        </section>

      </main>
    </div>
  );
}

function BudgetCard({ label, spent, limit, icon, warning, over }: any) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const percent = Math.min((spent / limit) * 100, 100);
  
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
    <div className="bg-surface dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-input-bg dark:bg-slate-800 rounded-xl flex items-center justify-center text-lg shadow-sm">
            {icon}
          </div>
          <div>
            <p className="font-bold text-text-dark dark:text-slate-100 text-[15px]">{label}</p>
            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1 ${badgeColor}`}>
              {statusText}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-end mb-2">
        <p className="font-bold text-lg text-text-dark dark:text-slate-100">{formatCurrency(spent)}</p>
        <p className="font-bold text-sm text-secondary">of {formatCurrency(limit)}</p>
      </div>
      <div className="h-2 w-full bg-input-bg dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
