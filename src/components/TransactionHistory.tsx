import React, { useState } from 'react';
import { ArrowLeft, Search, Filter, Banknote, ShoppingBasket, Coffee, Receipt, Calendar } from 'lucide-react';
import { ViewState, Transaction } from '../App';

export function TransactionHistory({ onNavigate, transactions }: { onNavigate: (v: ViewState) => void, transactions: Transaction[] }) {
  const [search, setSearch] = useState('');

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="flex flex-col min-h-full pb-20 relative bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10">
        <button onClick={() => onNavigate('dashboard')} className="text-text-dark dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-input-bg dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-2 text-text-dark dark:text-white">Transactions</h1>
        <button className="text-secondary hover:text-primary transition-colors p-2">
          <Filter size={20} />
        </button>
      </header>
      
      <div className="p-4 bg-surface dark:bg-surface-dark border-b border-border dark:border-slate-800">
        <div className="flex items-center gap-2 bg-input-bg dark:bg-slate-800 rounded-2xl p-3 border border-transparent focus-within:border-border transition-colors">
          <Search size={20} className="text-secondary" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-semibold w-full placeholder:text-secondary p-0 outline-none text-text-dark dark:text-white" 
          />
        </div>
      </div>

      <main className="p-4 flex flex-col flex-1 space-y-6">
        {/* Placeholder group 1 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
            <Calendar size={14} />
            Today
          </h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-2 shadow-sm border border-border dark:border-slate-800 space-y-1">
            {transactions.slice(0, 3).map(t => {
              const isExpense = t.type === 'Expense';
              let Icon = Banknote;
              let iconColor = 'text-primary';
              let bgConfig = 'bg-highlight dark:bg-primary/20';
              
              if (isExpense) {
                iconColor = 'text-secondary';
                bgConfig = 'bg-input-bg dark:bg-slate-800';
                if (t.category === 'Food') Icon = ShoppingBasket; 
                else if (t.category === 'Lifestyle' || t.category === 'Coffee') Icon = Coffee; 
              }

              return (
                <div key={t.id} className="flex items-center gap-4 group cursor-pointer p-3 rounded-2xl hover:bg-input-bg dark:hover:bg-slate-800/50 transition-colors">
                  <div className={`size-12 rounded-2xl ${bgConfig} flex items-center justify-center shrink-0`}>
                    <Icon className={iconColor} size={22} />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <p className="text-text-dark dark:text-slate-100 font-bold text-[15px]">{t.merchant || t.category}</p>
                      <p className="text-text-secondary dark:text-slate-500 text-xs font-medium mt-0.5">{t.category}</p>
                    </div>
                    <p className={`${isExpense ? 'text-text-dark dark:text-slate-100' : 'text-primary'} font-bold text-[15px]`}>
                      {isExpense ? '-' : '+'}{formatCurrency(t.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
