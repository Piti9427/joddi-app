import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Filter, Banknote, ShoppingBasket, Coffee, Receipt, Calendar, TrendingDown, TrendingUp, ChevronRight } from 'lucide-react';
import { ViewState, Transaction } from '../App';

export function TransactionHistory({ onNavigate, transactions }: { onNavigate: (v: ViewState) => void, transactions: Transaction[] }) {
  const [search, setSearch] = useState('');

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    const filtered = transactions.filter(t => 
      t.merchant?.toLowerCase().includes(search.toLowerCase()) || 
      t.category.toLowerCase().includes(search.toLowerCase())
    );

    filtered.forEach(t => {
      const dateString = new Date(t.date).toDateString();
      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(t);
    });
    
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [transactions, search]);

  const formatDateHeader = (dateString: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col min-h-full pb-32 relative bg-slate-50 dark:bg-background-dark">
      <header className="flex flex-col bg-white dark:bg-surface-dark p-6 border-b border-border dark:border-slate-800 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-2xl font-black tracking-tight text-text-dark dark:text-white">Activity</h1>
           <button className="text-primary p-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors">
              <Filter size={20} />
           </button>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white dark:focus-within:bg-slate-700 transition-all">
          <Search size={18} className="text-secondary" />
          <input 
            type="text" 
            placeholder="Search by merchant or category..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-[13px] font-bold w-full placeholder:text-secondary/60 outline-none text-text-dark dark:text-white" 
          />
        </div>
      </header>
      
      <main className="p-4 space-y-8 mt-2">
        {groupedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-10">
            <div className="size-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300">
               <Search size={48} />
            </div>
            <h3 className="text-lg font-black text-text-dark dark:text-white mb-2">No matching records</h3>
            <p className="text-secondary text-sm font-bold opacity-60">Try searching for something else or clear the filters.</p>
          </div>
        ) : (
          groupedTransactions.map(([date, dayTransactions]) => (
            <section key={date} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                 <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary opacity-60">
                   {formatDateHeader(date)}
                 </h3>
                 <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
              </div>

              <div className="space-y-2">
                {dayTransactions.map(t => {
                  const isExpense = t.type === 'Expense';
                  return (
                    <div key={t.id} className="bg-white dark:bg-surface-dark p-4 rounded-[2rem] shadow-sm border border-border/40 dark:border-slate-800/40 flex items-center gap-4 hover:shadow-md transition-all group active:scale-95 cursor-pointer">
                      <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${isExpense ? 'bg-expense-bg/60 text-expense' : 'bg-income-bg/60 text-income'}`}>
                        {isExpense ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                         <p className="font-extrabold text-[15px] text-text-dark dark:text-white truncate">{t.merchant || t.category}</p>
                         <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter opacity-70">{t.category}</p>
                      </div>
                      <div className="text-right">
                         <p className={`font-black text-[15px] ${isExpense ? 'text-text-dark dark:text-white' : 'text-income'}`}>
                           {isExpense ? '-' : '+'}{formatCurrency(t.amount)}
                         </p>
                         {t.note && <p className="text-[9px] font-bold text-secondary opacity-40 truncate max-w-[80px]">{t.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
