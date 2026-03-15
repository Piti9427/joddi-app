import React, { useState, useEffect } from 'react';
import { X, Check, Coffee, Utensils, Car, Receipt, ShoppingBag, Banknote, Gift, Shield, ChevronDown, Calendar, Tag, Plus, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { ViewState, Transaction, TransactionType } from '../App';
import { Category } from './CategoriesManagement';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: <Banknote size={16} /> },
  { id: 'bank', label: 'Bank Transfer', icon: <LandmarkIcon size={16} /> },
  { id: 'card', label: 'Credit Card', icon: <CreditCard size={16} /> },
  { id: 'ewallet', label: 'E-Wallet', icon: <Wallet size={16} /> },
  { id: 'promptpay', label: 'PromptPay', icon: <Smartphone size={16} /> }
];

function LandmarkIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="22" x2="22" y2="22"></line>
      <line x1="2" y1="9" x2="22" y2="9"></line>
      <line x1="3" y1="9" x2="3" y2="22"></line>
      <line x1="21" y1="9" x2="21" y2="22"></line>
      <line x1="7" y1="9" x2="7" y2="22"></line>
      <line x1="11" y1="9" x2="11" y2="22"></line>
      <line x1="17" y1="9" x2="17" y2="22"></line>
      <path d="M12 2L2 9h20L12 2z"></path>
    </svg>
  );
}

export function AddTransaction({ onNavigate, onAddTransaction }: { 
  onNavigate: (v: ViewState) => void, 
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void 
}) {
  const [amount, setAmount] = useState('0');
  const [type, setType] = useState<TransactionType>('Expense');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [userCategories, setUserCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = () => {
      const saved = localStorage.getItem('user_categories');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUserCategories(parsed);
            return;
          }
        } catch (e) {
          console.error("Failed to parse categories", e);
        }
      }
      
      const defaultCategories: Category[] = [
        { id: '1', name: 'Food', type: 'Expense', iconName: 'Utensils', color: 'text-rose-500' },
        { id: '2', name: 'Transport', type: 'Expense', iconName: 'Car', color: 'text-blue-500' },
        { id: '3', name: 'Coffee', type: 'Expense', iconName: 'Coffee', color: 'text-amber-600' },
        { id: '4', name: 'Salary', type: 'Income', iconName: 'Banknote', color: 'text-primary' },
      ];
      setUserCategories(defaultCategories);
      localStorage.setItem('user_categories', JSON.stringify(defaultCategories));
    };

    loadCategories();
    window.addEventListener('storage', loadCategories);
    return () => window.removeEventListener('storage', loadCategories);
  }, []);

  const filteredCategories = userCategories.filter(cat => cat.type === type);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some(c => c.name === category)) {
      setCategory(filteredCategories[0].name);
    }
  }, [type, filteredCategories]);

  const handleKeyPress = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (amount === '0' && num !== '.') {
      setAmount(num);
    } else {
      setAmount(prev => prev + num);
    }
  };

  const handleDelete = () => {
    if (amount.length <= 1) {
      setAmount('0');
    } else {
      setAmount(prev => prev.slice(0, -1));
    }
  };

  const handleSave = () => {
    const val = parseFloat(amount);
    if (val === 0) return;
    
    onAddTransaction({
      type,
      amount: val,
      category: category || (type === 'Expense' ? 'Misc' : 'Income'),
      note,
      date,
      merchant: note || category
    });
    onNavigate('dashboard');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-background-dark rounded-t-[3rem] shadow-2xl overflow-hidden border-t border-border dark:border-slate-800 animate-in slide-in-from-bottom-full duration-500">
      {/* Dynamic Background Header */}
      <div className={`pt-6 px-4 pb-12 transition-colors duration-500 ${type === 'Expense' ? 'bg-expense/10 dark:bg-expense/20' : 'bg-primary/10 dark:bg-primary/20'}`}>
        <div className="flex justify-between items-center mb-8 px-2">
          <button onClick={() => onNavigate('dashboard')} className="size-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-sm text-secondary hover:text-text-dark transition-colors">
            <X size={20} />
          </button>
          
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-inner border border-border dark:border-slate-800">
            <button 
              onClick={() => setType('Expense')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${type === 'Expense' ? 'bg-expense text-white shadow-lg' : 'text-secondary hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              Expense
            </button>
            <button 
              onClick={() => setType('Income')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${type === 'Income' ? 'bg-primary text-white shadow-lg' : 'text-secondary hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              Income
            </button>
          </div>
          
          <div className="size-10" /> {/* Spacer */}
        </div>

        <div className="text-center group">
          <p className="text-secondary text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-60">Amount</p>
          <div className="flex items-center justify-center gap-2 group-active:scale-110 transition-transform">
            <span className={`text-4xl font-black ${type === 'Expense' ? 'text-expense' : 'text-primary'}`}>$</span>
            <span className="text-6xl font-black tracking-tighter text-text-dark dark:text-white transition-all tabular-nums whitespace-nowrap overflow-hidden max-w-full">
              {amount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="flex-1 overflow-y-auto px-6 space-y-8 -mt-6 rounded-t-[3rem] bg-white dark:bg-background-dark pt-10">
        
        {/* Categories Horizontal Scroll */}
        <section>
          <div className="flex justify-between items-center mb-4 px-2">
            <p className="text-[10px] text-secondary font-black uppercase tracking-widest">Select Category</p>
            <button onClick={() => onNavigate('categories')} className="text-primary hover:text-text-dark transition-colors"><Plus size={18} /></button>
          </div>
          <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-2 px-2">
            {filteredCategories.map(cat => (
              <CategoryChip 
                key={cat.id}
                icon={cat.iconName}
                label={cat.name}
                color={cat.color}
                selected={category === cat.name}
                onClick={() => setCategory(cat.name)}
              />
            ))}
          </div>
        </section>

        {/* Date & Note & Payment Method */}
        <div className="grid grid-cols-1 gap-6 pb-20">
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl group border border-transparent focus-within:border-primary/20 transition-all">
            <Calendar className="text-secondary group-focus-within:text-primary transition-colors" size={20} />
            <div className="flex-1">
              <p className="text-[10px] text-secondary font-black uppercase tracking-widest mb-1 opacity-50">Transaction Date</p>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-[15px] font-bold text-text-dark dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl group border border-transparent focus-within:border-primary/20 transition-all">
            <Tag className="text-secondary group-focus-within:text-primary transition-colors" size={20} />
            <div className="flex-1">
              <p className="text-[10px] text-secondary font-black uppercase tracking-widest mb-1 opacity-50">Note / Merchant</p>
              <input 
                type="text" 
                placeholder="What was this for?"
                value={note} 
                onChange={e => setNote(e.target.value)}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-[15px] font-bold text-text-dark dark:text-white placeholder:text-secondary/40"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-2">
              <p className="text-[10px] text-secondary font-black uppercase tracking-widest">Payment Method</p>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-2 px-2">
              {PAYMENT_METHODS.map(method => (
                <button 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border-2 ${paymentMethod === method.id ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent text-secondary hover:border-slate-200'}`}
                >
                  {method.icon}
                  {method.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Numeric Keypad & Submit */}
      <div className="bg-slate-50 dark:bg-slate-900/80 backdrop-blur-md p-6 border-t border-border dark:border-slate-800">
        <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
          <div className="col-span-3 grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'].map(key => (
              <button 
                key={key} 
                onClick={() => key === 'delete' ? handleDelete() : handleKeyPress(key)}
                className="h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-text-dark dark:text-white shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition-all transition-transform duration-100"
              >
                {key === 'delete' ? <ChevronDown className="rotate-90" /> : key}
              </button>
            ))}
          </div>
          <button 
            onClick={handleSave}
            disabled={parseFloat(amount) === 0}
            className={`flex items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-30 ${type === 'Expense' ? 'bg-expense text-white shadow-expense/20' : 'bg-primary text-white shadow-primary/20'}`}
          >
            <Check size={32} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryChip({ icon, label, color, selected, onClick }: any) {
  const getIcon = () => {
    switch(icon) {
      case 'Utensils': return <Utensils size={18} />;
      case 'Coffee': return <Coffee size={18} />;
      case 'Car': return <Car size={18} />;
      case 'Receipt': return <Receipt size={18} />;
      case 'ShoppingBag': return <ShoppingBag size={18} />;
      case 'Shield': return <Shield size={18} />;
      case 'Banknote': return <Banknote size={18} />;
      case 'Gift': return <Gift size={18} />;
      case 'Tag': return <Tag size={18} />;
      default: return <Tag size={18} />;
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all border-2 whitespace-nowrap ${selected ? `bg-white dark:bg-slate-800 border-primary shadow-md scale-110 z-10 ${color}` : 'bg-slate-50 dark:bg-slate-800/40 border-transparent text-secondary hover:border-slate-100'}`}
    >
      <span className={selected ? color : 'text-inherit opacity-60'}>{getIcon()}</span>
      <span className="text-[13px] font-extrabold">{label}</span>
    </button>
  );
}
