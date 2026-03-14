import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Utensils, Car, Receipt, ShoppingBag, Calendar, CreditCard, AlignLeft, Delete, ArrowRight, Banknote, Coffee, Shield, Gift, Tag, Plus } from 'lucide-react';
import { ViewState, TransactionType } from '../App';

const ICON_MAP: Record<string, React.ReactNode> = {
  Coffee: <Coffee size={18} />,
  Utensils: <Utensils size={18} />,
  Car: <Car size={18} />,
  Receipt: <Receipt size={18} />,
  ShoppingBag: <ShoppingBag size={18} />,
  Shield: <Shield size={18} />,
  Banknote: <Banknote size={18} />,
  Gift: <Gift size={18} />,
};

interface SavedCategory {
  id: string;
  name: string;
  type: 'Expense' | 'Income';
  iconName: string;
  color: string;
}

const DEFAULT_CATEGORIES: SavedCategory[] = [
  { id: '1', name: 'Coffee', type: 'Expense', iconName: 'Coffee', color: 'text-amber-600 dark:text-amber-400' },
  { id: '2', name: 'Food', type: 'Expense', iconName: 'Utensils', color: 'text-rose-500 dark:text-rose-400' },
  { id: '3', name: 'Transport', type: 'Expense', iconName: 'Car', color: 'text-blue-500 dark:text-blue-400' },
  { id: '4', name: 'Bills', type: 'Expense', iconName: 'Receipt', color: 'text-secondary dark:text-slate-400' },
  { id: '5', name: 'Shopping', type: 'Expense', iconName: 'ShoppingBag', color: 'text-primary dark:text-primary' },
  { id: '6', name: 'Lifestyle', type: 'Expense', iconName: 'Shield', color: 'text-indigo-500 dark:text-indigo-400' },
  { id: '7', name: 'Entertainment', type: 'Expense', iconName: 'Tag', color: 'text-pink-500 dark:text-pink-400' },
  { id: '8', name: 'Health', type: 'Expense', iconName: 'Shield', color: 'text-emerald-500 dark:text-emerald-400' },
  { id: '9', name: 'Income', type: 'Income', iconName: 'Banknote', color: 'text-grass dark:text-grass/80' },
  { id: '10', name: 'Gifts', type: 'Income', iconName: 'Gift', color: 'text-fuchsia-500 dark:text-fuchsia-400' },
  { id: '11', name: 'Freelance', type: 'Income', iconName: 'Banknote', color: 'text-blue-500 dark:text-blue-400' },
];

export function AddTransaction({ onNavigate, onAddTransaction }: { onNavigate: (v: ViewState) => void; onAddTransaction: (t: any) => void }) {
  const [amountStr, setAmountStr] = useState('0');
  const [type, setType] = useState<TransactionType>('Expense');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [userCategories, setUserCategories] = useState<SavedCategory[]>([]);
  
  const todayFormatted = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayFormatted);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Load categories from localStorage
  useEffect(() => {
    const loadCategories = () => {
      const saved = localStorage.getItem('user_categories');
      try {
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUserCategories(parsed);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to parse categories", e);
      }
      
      // Fallback/First run
      setUserCategories(DEFAULT_CATEGORIES);
      localStorage.setItem('user_categories', JSON.stringify(DEFAULT_CATEGORIES));
    };

    loadCategories();
    
    // Listen for storage changes if the user updates categories in another screen
    window.addEventListener('storage', loadCategories);
    return () => window.removeEventListener('storage', loadCategories);
  }, []);

  // Filter categories based on selected type (Expense or Income)
  const filteredCategories = useMemo(() => {
    return userCategories.filter(c => c.type === type);
  }, [userCategories, type]);

  // Auto-select first category when type changes
  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.name === category)) {
      setCategory(filteredCategories[0].name);
    }
  }, [filteredCategories, type]);

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
    
    const d = new Date(date + 'T12:00:00Z');
    
    onAddTransaction({
      type,
      amount: amt,
      category: category || type,
      note: note ? note : `Paid via ${paymentMethod}`,
      date: isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(),
      merchant: category || type
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
            <label className="flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-slate-700 has-[:checked]:shadow-sm text-secondary dark:text-slate-400 has-[:checked]:text-expense text-sm font-bold transition-all">
              <span className="truncate">Expense</span>
              <input type="radio" name="transaction-type" value="Expense" className="hidden" checked={type === 'Expense'} onChange={() => setType('Expense')} />
            </label>
            <label className="flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 has-[:checked]:bg-white dark:has-[:checked]:bg-slate-700 has-[:checked]:shadow-sm text-secondary dark:text-slate-400 has-[:checked]:text-income text-sm font-bold transition-all">
              <span className="truncate">Income</span>
              <input type="radio" name="transaction-type" value="Income" className="hidden" checked={type === 'Income'} onChange={() => setType('Income')} />
            </label>
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col items-center px-6 py-6">
          <span className="text-secondary text-xs font-bold uppercase tracking-widest mb-1">Amount</span>
          <h1 className={`${type === 'Income' ? 'text-income' : 'text-text-dark dark:text-white'} tracking-tight text-5xl font-extrabold leading-tight font-display`}>${amountStr}</h1>
        </div>

        {/* Categories - Dynamic from localStorage */}
        <div className="flex gap-2 px-6 py-2 overflow-x-auto no-scrollbar shrink-0 flex-nowrap items-center">
          {filteredCategories.map(cat => (
            <div key={cat.id} onClick={() => setCategory(cat.name)}>
              <CategoryChip 
                icon={ICON_MAP[cat.iconName] || <Tag size={18} />} 
                label={cat.name} 
                active={category === cat.name} 
              />
            </div>
          ))}
          <button 
            onClick={() => onNavigate('categories')}
            className="flex h-10 size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed border-secondary text-secondary hover:bg-highlight transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-4 space-y-3">
          {/* Date Picker */}
          <div className="flex items-center gap-3 p-3 bg-input-bg dark:bg-slate-800 rounded-2xl border border-transparent focus-within:border-border transition-colors relative">
            <Calendar className="text-secondary pointer-events-none" size={20} />
            <div className="flex flex-col flex-1 relative">
              <span className="text-[10px] text-secondary font-bold uppercase tracking-wider pointer-events-none">Date</span>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="bg-transparent border-none focus:ring-0 text-sm font-semibold w-full p-0 outline-none text-text-dark dark:text-white cursor-pointer" 
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="flex items-center gap-3 p-3 bg-input-bg dark:bg-slate-800 rounded-2xl border border-transparent focus-within:border-border transition-colors cursor-pointer">
            <CreditCard className="text-secondary" size={20} />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Payment Method</span>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)} 
                className="bg-transparent border-none focus:ring-0 text-sm font-semibold w-full p-0 outline-none text-text-dark dark:text-white appearance-none cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="PromptPay">PromptPay</option>
              </select>
            </div>
          </div>

          {/* Note Input */}
          <div className="flex items-center gap-3 p-3 bg-input-bg dark:bg-slate-800 rounded-2xl border border-transparent focus-within:border-border transition-colors">
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
