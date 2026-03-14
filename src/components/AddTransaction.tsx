import React, { useState } from 'react';
import { X, Check, Utensils, Car, Receipt, ShoppingBag, Calendar, CreditCard, AlignLeft, Delete, ArrowRight, Banknote } from 'lucide-react';
import { ViewState, TransactionType } from '../App';

export function AddTransaction({ onNavigate, onAddTransaction }: { onNavigate: (v: ViewState) => void; onAddTransaction: (t: any) => void }) {
  const [amountStr, setAmountStr] = useState('0');
  const [type, setType] = useState<TransactionType>('Expense');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');

  const handleKeyPress = (key: string | number) => {
    if (key === 'Delete') {
      setAmountStr(amountStr.slice(0, -1) || '0');
    } else {
      if (amountStr === '0' && key !== '.') {
        setAmountStr(String(key));
      } else {
        if (key === '.' && amountStr.includes('.')) return;
        
        if (amountStr.includes('.')) {
          const [, dec] = amountStr.split('.');
          if (dec && dec.length >= 2) return;
        }
        
        setAmountStr(amountStr + key);
      }
    }
  };

  const handleSave = () => {
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt <= 0) return;
    
    onAddTransaction({
      type,
      amount: amt,
      category,
      note,
      date: new Date().toISOString(),
      merchant: category
    });
    onNavigate('dashboard');
  };

  return (
    <div className="flex flex-col items-stretch bg-surface dark:bg-background-dark rounded-t-[2rem] shadow-2xl overflow-hidden h-full">
      {/* Handle */}
      <div className="flex h-6 w-full items-center justify-center shrink-0">
        <div className="h-1.5 w-12 rounded-full bg-border dark:bg-slate-700"></div>
      </div>

      {/* Header */}
      <div className="flex items-center bg-surface dark:bg-background-dark px-6 py-2 justify-between shrink-0">
        <button onClick={() => onNavigate('dashboard')} className="text-secondary hover:text-text-dark dark:text-slate-400 dark:hover:text-white p-1 transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-text-dark dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center font-display">Add Transaction</h2>
        <div className="flex w-10 items-center justify-end">
          <button onClick={handleSave} className="flex items-center justify-center rounded-full h-10 w-10 bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
            <Check size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto no-scrollbar pb-8">
        {/* Type Toggle */}
        <div className="flex px-6 py-3">
          <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-input-bg dark:bg-slate-800 p-1.5">
            <label className="flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-slate-700 has-[:checked]:shadow-sm text-secondary dark:text-slate-400 has-[:checked]:text-primary text-sm font-bold transition-all">
              <span className="truncate">Expense</span>
              <input type="radio" name="transaction-type" value="Expense" className="hidden" checked={type === 'Expense'} onChange={() => setType('Expense')} />
            </label>
            <label className="flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-slate-700 has-[:checked]:shadow-sm text-secondary dark:text-slate-400 has-[:checked]:text-primary text-sm font-bold transition-all">
              <span className="truncate">Income</span>
              <input type="radio" name="transaction-type" value="Income" className="hidden" checked={type === 'Income'} onChange={() => setType('Income')} />
            </label>
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col items-center px-6 py-6">
          <span className="text-secondary text-xs font-bold uppercase tracking-widest mb-1">Amount</span>
          <h1 className={`${type === 'Income' ? 'text-primary' : 'text-text-dark dark:text-white'} tracking-tight text-5xl font-extrabold leading-tight font-display`}>${amountStr}</h1>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-6 py-2 overflow-x-auto no-scrollbar shrink-0">
          <div onClick={() => setCategory('Food')}><CategoryChip icon={<Utensils size={18} />} label="Food" active={category === 'Food'} /></div>
          <div onClick={() => setCategory('Transport')}><CategoryChip icon={<Car size={18} />} label="Transport" active={category === 'Transport'} /></div>
          <div onClick={() => setCategory('Bills')}><CategoryChip icon={<Receipt size={18} />} label="Bills" active={category === 'Bills'} /></div>
          <div onClick={() => setCategory('Shop')}><CategoryChip icon={<ShoppingBag size={18} />} label="Shop" active={category === 'Shop'} /></div>
          <div onClick={() => setCategory('Income')}><CategoryChip icon={<Banknote size={18} />} label="Income" active={category === 'Income'} /></div>
        </div>

        {/* Fields */}
        <div className="px-6 py-4 space-y-3">
          <FieldRow icon={<Calendar size={20} />} label="Date" value="Today" />
          <FieldRow icon={<CreditCard size={20} />} label="Payment Method" value="Visa ···· 4242" />
          <div className="flex items-center gap-3 p-3 bg-input-bg dark:bg-slate-800 rounded-2xl border border-transparent hover:border-border transition-colors">
            <AlignLeft className="text-secondary" size={20} />
            <input type="text" placeholder="Add a note..." value={note} onChange={e => setNote(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-semibold w-full placeholder:text-secondary p-0 outline-none text-text-dark dark:text-white" />
          </div>
        </div>

        {/* Keypad */}
        <div className="px-6 pt-2 pb-6">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((key) => (
              <button key={key} onClick={() => handleKeyPress(key)} className="h-14 flex items-center justify-center text-xl font-bold bg-input-bg dark:bg-slate-800 rounded-2xl active:bg-highlight/50 dark:active:bg-primary/20 transition-colors text-text-dark dark:text-white">
                {key}
              </button>
            ))}
            <button onClick={() => handleKeyPress('Delete')} className="h-14 flex items-center justify-center text-xl font-bold bg-input-bg dark:bg-slate-800 rounded-2xl active:bg-highlight/50 dark:active:bg-primary/20 transition-colors text-secondary hover:text-text-dark dark:hover:text-white">
              <Delete size={24} />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 pb-4">
          <button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
            <span>Save Transaction</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryChip({ icon, label, active }: any) {
  return (
    <div className={`flex h-10 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-4 border transition-colors ${active ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' : 'bg-input-bg dark:bg-slate-800 text-text-secondary dark:text-slate-300 border-transparent hover:border-border'}`}>
      {icon}
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

function FieldRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-input-bg dark:bg-slate-800 rounded-2xl border border-transparent hover:border-border transition-colors cursor-pointer">
      <div className="text-secondary">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">{label}</span>
        <span className="text-sm font-semibold text-text-dark dark:text-white">{value}</span>
      </div>
    </div>
  );
}

