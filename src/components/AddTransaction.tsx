import React from 'react';
import { X, Check, Utensils, Car, Receipt, ShoppingBag, Calendar, CreditCard, AlignLeft, Delete, ArrowRight } from 'lucide-react';
import { ViewState } from '../App';

export function AddTransaction({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  return (
    <div className="flex flex-col items-stretch bg-white dark:bg-background-dark rounded-t-[2rem] shadow-2xl overflow-hidden h-full">
      {/* Handle */}
      <div className="flex h-6 w-full items-center justify-center shrink-0">
        <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700"></div>
      </div>

      {/* Header */}
      <div className="flex items-center bg-white dark:bg-background-dark px-6 py-2 justify-between shrink-0">
        <button onClick={() => onNavigate('dashboard')} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 p-1">
          <X size={24} />
        </button>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center font-display">Add Transaction</h2>
        <div className="flex w-10 items-center justify-end">
          <button onClick={() => onNavigate('dashboard')} className="flex items-center justify-center rounded-full h-10 w-10 bg-primary/10 text-primary transition-colors">
            <Check size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto no-scrollbar pb-8">
        {/* Type Toggle */}
        <div className="flex px-6 py-3">
          <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-background-light dark:bg-slate-800 p-1.5">
            <label className="flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-slate-700 has-[:checked]:shadow-sm text-slate-500 dark:text-slate-400 has-[:checked]:text-primary text-sm font-bold transition-all">
              <span className="truncate">Expense</span>
              <input type="radio" name="transaction-type" value="Expense" className="hidden" defaultChecked />
            </label>
            <label className="flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-slate-700 has-[:checked]:shadow-sm text-slate-500 dark:text-slate-400 has-[:checked]:text-primary text-sm font-bold transition-all">
              <span className="truncate">Income</span>
              <input type="radio" name="transaction-type" value="Income" className="hidden" />
            </label>
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col items-center px-6 py-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Amount</span>
          <h1 className="text-primary tracking-tight text-5xl font-extrabold leading-tight font-display">$42.50</h1>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-6 py-2 overflow-x-auto no-scrollbar shrink-0">
          <CategoryChip icon={<Utensils size={18} />} label="Food" active />
          <CategoryChip icon={<Car size={18} />} label="Transport" />
          <CategoryChip icon={<Receipt size={18} />} label="Bills" />
          <CategoryChip icon={<ShoppingBag size={18} />} label="Shop" />
        </div>

        {/* Fields */}
        <div className="px-6 py-4 space-y-3">
          <FieldRow icon={<Calendar size={20} />} label="Date" value="Today, Oct 24" />
          <FieldRow icon={<CreditCard size={20} />} label="Payment Method" value="Visa ···· 4242" />
          <div className="flex items-center gap-3 p-3 bg-background-light dark:bg-slate-800 rounded-xl">
            <AlignLeft className="text-slate-400" size={20} />
            <input type="text" placeholder="Add a note..." className="bg-transparent border-none focus:ring-0 text-sm font-semibold w-full placeholder:text-slate-400 p-0 outline-none" />
          </div>
        </div>

        {/* Keypad */}
        <div className="px-6 pt-2 pb-6">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((key) => (
              <button key={key} className="h-14 flex items-center justify-center text-xl font-bold bg-background-light dark:bg-slate-800 rounded-xl active:bg-primary/20 transition-colors">
                {key}
              </button>
            ))}
            <button className="h-14 flex items-center justify-center text-xl font-bold bg-background-light dark:bg-slate-800 rounded-xl active:bg-primary/20 transition-colors">
              <Delete size={24} />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 pb-4">
          <button onClick={() => onNavigate('dashboard')} className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
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
    <div className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 border ${active ? 'bg-primary text-white border-primary' : 'bg-background-light dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'}`}>
      {icon}
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

function FieldRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-background-light dark:bg-slate-800 rounded-xl">
      <div className="text-slate-400">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
        <span className="text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
}
