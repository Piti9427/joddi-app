import React, { useMemo } from 'react';
import { ArrowLeft, Plus, Coffee, Utensils, Car, Receipt, ShoppingBag, Banknote, Gift, Shield, MoreHorizontal } from 'lucide-react';
import { ViewState, Transaction } from '../App';

export function CategoriesManagement({ onNavigate, transactions }: { onNavigate: (v: ViewState) => void, transactions: Transaction[] }) {
  
  const { expenses, incomes } = useMemo(() => {
    const expCounts: { [key: string]: number } = {};
    const incCounts: { [key: string]: number } = {};

    transactions.forEach(t => {
      if (t.type === 'Expense') {
        expCounts[t.category] = (expCounts[t.category] || 0) + 1;
      } else {
        incCounts[t.category] = (incCounts[t.category] || 0) + 1;
      }
    });

    // Default categories if none exist yet
    const defaultExp = [
      { name: 'Coffee', icon: <Coffee />, color: 'text-amber-600 dark:text-amber-400', count: expCounts['Coffee'] || 0 },
      { name: 'Food', icon: <Utensils />, color: 'text-rose-500 dark:text-rose-400', count: expCounts['Food'] || 0 },
      { name: 'Transport', icon: <Car />, color: 'text-blue-500 dark:text-blue-400', count: expCounts['Transport'] || 0 },
      { name: 'Bills', icon: <Receipt />, color: 'text-secondary dark:text-slate-400', count: expCounts['Bills'] || 0 },
      { name: 'Shopping', icon: <ShoppingBag />, color: 'text-primary dark:text-primary', count: expCounts['Shopping'] || 0 },
      { name: 'Lifestyle', icon: <Shield />, color: 'text-indigo-500 dark:text-indigo-400', count: expCounts['Lifestyle'] || 0 }
    ];

    const defaultInc = [
      { name: 'Income', icon: <Banknote />, color: 'text-grass dark:text-grass/80', count: incCounts['Income'] || 0 },
      { name: 'Gifts', icon: <Gift />, color: 'text-fuchsia-500 dark:text-fuchsia-400', count: incCounts['Gifts'] || 0 }
    ];

    return { expenses: defaultExp, incomes: defaultInc };
  }, [transactions]);

  return (
    <div className="flex flex-col min-h-full pb-20 relative bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10">
        <button onClick={() => onNavigate('dashboard')} className="text-text-dark dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-input-bg dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-2 text-text-dark dark:text-white">Categories</h1>
        <button className="text-primary hover:text-text-dark transition-colors p-2 bg-highlight dark:bg-primary/20 rounded-full">
          <Plus size={20} />
        </button>
      </header>

      <main className="p-4 flex flex-col flex-1 space-y-6">
        
        {/* Expenses List */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary pl-2">Expense Categories</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-3 shadow-sm border border-border dark:border-slate-800 space-y-1">
            {expenses.map(cat => (
              <CategoryRow key={cat.name} icon={cat.icon} name={cat.name} color={cat.color} count={cat.count} />
            ))}
          </div>
        </section>

        {/* Income List */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary pl-2">Income Categories</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-3 shadow-sm border border-border dark:border-slate-800 space-y-1">
            {incomes.map(cat => (
              <CategoryRow key={cat.name} icon={cat.icon} name={cat.name} color={cat.color} count={cat.count} />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

function CategoryRow({ icon, name, color, count }: any) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer p-3 rounded-2xl hover:bg-input-bg dark:hover:bg-slate-800/50 transition-colors">
      <div className={`size-12 rounded-2xl bg-input-bg dark:bg-slate-800 flex items-center justify-center shrink-0 ${color}`}>
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <div className="flex-1 flex justify-between items-center">
        <div>
          <p className="text-text-dark dark:text-slate-100 font-bold text-[15px]">{name}</p>
          <p className="text-text-secondary dark:text-slate-500 text-xs font-medium mt-0.5">{count} transactions</p>
        </div>
        <button className="text-secondary hover:text-text-dark dark:hover:text-white transition-colors p-2">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}
