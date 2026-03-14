import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Filter, Banknote, ShoppingBasket, Coffee, Receipt, Calendar } from 'lucide-react';
import { ViewState, Transaction } from '../App';

export function TransactionHistory({ onNavigate, transactions }: { onNavigate: (v: ViewState) => void, transactions: Transaction[] }) {
  const [search, setSearch] = useState('');

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Group transactions by date
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
    
    // Sort dates descending
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [transactions, search]);

  const formatDateHeader = (dateString: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dateString === today) return 'Today';
    if (dateString === yesterday) return 'Yesterday';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
        
        {groupedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-secondary">
            <Receipt size={48} className="mb-4 opacity-50" />
            <p className="font-bold">No transactions found</p>
          </div>
        ) : (
          groupedTransactions.map(([date, dayTransactions]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                <Calendar size={14} />
                {formatDateHeader(date)}
              </h3>
              <div className="bg-surface dark:bg-surface-dark rounded-3xl p-2 shadow-sm border border-border dark:border-slate-800 space-y-1">
                {dayTransactions.map(t => {
                  const isExpense = t.type === 'Expense';
                  let Icon = Banknote;
                  let iconColor = 'text-income';
                  let bgConfig = 'bg-income-bg dark:bg-income/20';
                  
                  if (isExpense) {
                    iconColor = 'text-expense';
                    bgConfig = 'bg-expense-bg dark:bg-expense/20';
                    if (t.category === 'Food') Icon = ShoppingBasket; 
                    else if (t.category === 'Lifestyle' || t.category === 'Coffee') Icon = Coffee; 
                    else Icon = Receipt;
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
                        <p className={`${isExpense ? 'text-text-dark dark:text-slate-100' : 'text-income max-dark:text-income'} font-bold text-[15px]`}>
                          {isExpense ? '-' : '+'}{formatCurrency(t.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

      </main>
    </div>
  );
}
