import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Plus, Coffee, Utensils, Car, Receipt, ShoppingBag, Banknote, Gift, Shield, MoreHorizontal, X, Trash, Check, Tag } from 'lucide-react';
import { ViewState, Transaction } from '../App';

export interface Category {
  id: string;
  name: string;
  type: 'Expense' | 'Income';
  iconName: string;
  color: string;
}

const DEFAULT_CATEGORIES: Category[] = [
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

const ICONS: Record<string, React.ReactNode> = {
  Coffee: <Coffee />,
  Utensils: <Utensils />,
  Car: <Car />,
  Receipt: <Receipt />,
  ShoppingBag: <ShoppingBag />,
  Shield: <Shield />,
  Banknote: <Banknote />,
  Gift: <Gift />,
  Tag: <Tag />,
};

const ICON_OPTIONS = [
  { name: 'Coffee', icon: <Coffee size={20} /> },
  { name: 'Utensils', icon: <Utensils size={20} /> },
  { name: 'Car', icon: <Car size={20} /> },
  { name: 'Receipt', icon: <Receipt size={20} /> },
  { name: 'ShoppingBag', icon: <ShoppingBag size={20} /> },
  { name: 'Shield', icon: <Shield size={20} /> },
  { name: 'Banknote', icon: <Banknote size={20} /> },
  { name: 'Gift', icon: <Gift size={20} /> },
  { name: 'Tag', icon: <Tag size={20} /> },
];

const COLOR_OPTIONS = [
  { name: 'Red', value: 'text-rose-500 dark:text-rose-400' },
  { name: 'Blue', value: 'text-blue-500 dark:text-blue-400' },
  { name: 'Amber', value: 'text-amber-600 dark:text-amber-400' },
  { name: 'Green', value: 'text-primary dark:text-primary' },
  { name: 'Indigo', value: 'text-indigo-500 dark:text-indigo-400' },
  { name: 'Pink', value: 'text-pink-500 dark:text-pink-400' },
  { name: 'Emerald', value: 'text-emerald-500 dark:text-emerald-400' },
  { name: 'Fuchsia', value: 'text-fuchsia-500 dark:text-fuchsia-400' },
];

export function CategoriesManagement({ onNavigate, transactions }: { onNavigate: (v: ViewState) => void, transactions: Transaction[] }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit states
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Receipt');
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0].value);
  const [editType, setEditType] = useState<'Expense' | 'Income'>('Expense');
  
  // Add states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Expense' | 'Income'>('Expense');
  const [newIcon, setNewIcon] = useState('Receipt');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].value);

  useEffect(() => {
    const saved = localStorage.getItem('user_categories');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to parse", e);
    }
    setCategories(DEFAULT_CATEGORIES);
    localStorage.setItem('user_categories', JSON.stringify(DEFAULT_CATEGORIES));
  }, []);

  const saveCategories = (cats: Category[]) => {
    setCategories(cats);
    localStorage.setItem('user_categories', JSON.stringify(cats));
    window.dispatchEvent(new Event('storage'));
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.iconName);
    setEditColor(cat.color);
    setEditType(cat.type);
    setShowAddForm(false);
  };

  const handleSave = (id: string) => {
    if (!editName.trim()) return;
    const updated = categories.map(c => c.id === id ? { ...c, name: editName.trim(), iconName: editIcon, color: editColor, type: editType } : c);
    saveCategories(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this category?')) {
      const updated = categories.filter(c => c.id !== id);
      saveCategories(updated);
      setEditingId(null);
    }
  };

  const handleAddNew = () => {
    if (!newName.trim()) return;
    const newCat: Category = {
      id: Math.random().toString(36).substring(2, 9),
      name: newName.trim(),
      type: newType,
      iconName: newIcon,
      color: newColor
    };
    saveCategories([...categories, newCat]);
    setNewName('');
    setShowAddForm(false);
  };

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

    const exps = categories.filter(c => c.type === 'Expense').map(c => ({
      ...c, count: expCounts[c.name] || 0
    }));

    const incs = categories.filter(c => c.type === 'Income').map(c => ({
      ...c, count: incCounts[c.name] || 0
    }));

    return { expenses: exps, incomes: incs };
  }, [transactions, categories]);

  return (
    <div className="flex flex-col min-h-full pb-6 relative bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}>
        <div className="size-10 shrink-0"></div>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center text-text-dark dark:text-white">Categories</h1>
        <button onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); }} className="text-primary hover:text-text-dark transition-colors p-2 bg-highlight dark:bg-primary/20 rounded-full">
          {showAddForm ? <X size={20} /> : <Plus size={20} />}
        </button>
      </header>

      <main className="p-4 flex flex-col flex-1 space-y-6">
        
        {/* ADD FORM */}
        {showAddForm && (
          <section className="bg-surface dark:bg-surface-dark rounded-3xl p-6 shadow-xl border-2 border-primary/40 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-extrabold text-primary flex items-center gap-2">Create New Category</h3>
               <button onClick={() => setShowAddForm(false)} className="text-secondary hover:text-rose-500 transition-colors"><X size={18} /></button>
            </div>
            
            <div className="space-y-4">
              <input 
                autoFocus
                type="text" 
                placeholder="Ex: Groceries, Games, etc."
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                className="w-full bg-input-bg dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 text-text-dark dark:text-white font-bold"
              />

              <div className="flex gap-2">
                <button onClick={() => setNewType('Expense')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${newType === 'Expense' ? 'bg-expense text-white shadow-md' : 'bg-input-bg dark:bg-slate-800 text-secondary'}`}>Expense</button>
                <button onClick={() => setNewType('Income')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${newType === 'Income' ? 'bg-income text-white shadow-md' : 'bg-input-bg dark:bg-slate-800 text-secondary'}`}>Income</button>
              </div>

              <div>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-2">Select Icon</p>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(opt => (
                    <button key={opt.name} onClick={() => setNewIcon(opt.name)} className={`size-10 rounded-xl flex items-center justify-center transition-all ${newIcon === opt.name ? 'bg-primary text-white scale-110 shadow-md shadow-primary/20' : 'bg-input-bg dark:bg-slate-800 text-secondary'}`}>
                      {opt.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-2">Select Color</p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(opt => (
                    <button key={opt.name} onClick={() => setNewColor(opt.value)} className={`size-8 rounded-full transition-all ${opt.value.split(' ')[0].replace('text-', 'bg-')} ${newColor === opt.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'opacity-60 hover:opacity-100'}`} />
                  ))}
                </div>
              </div>

              <button onClick={handleAddNew} disabled={!newName.trim()} className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                <Check size={20} /> Create Category
              </button>
            </div>
          </section>
        )}

        {/* Expenses */}
        <section className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-secondary pl-2">Expenses ({expenses.length})</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-2 shadow-sm border border-border dark:border-slate-800 space-y-1">
            {expenses.map(cat => (
              <CategoryRow 
                key={cat.id} 
                category={cat}
                count={cat.count} 
                editing={editingId === cat.id}
                editName={editName}
                editIcon={editIcon}
                editColor={editColor}
                setEditName={setEditName}
                setEditIcon={setEditIcon}
                setEditColor={setEditColor}
                onEdit={() => handleEdit(cat)}
                onSave={() => handleSave(cat.id)}
                onDelete={() => handleDelete(cat.id)}
                onCancel={() => setEditingId(null)}
              />
            ))}
          </div>
        </section>

        {/* Income */}
        <section className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-secondary pl-2">Income ({incomes.length})</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-2 shadow-sm border border-border dark:border-slate-800 space-y-1">
            {incomes.map(cat => (
              <CategoryRow 
                key={cat.id} 
                category={cat}
                count={cat.count} 
                editing={editingId === cat.id}
                editName={editName}
                editIcon={editIcon}
                editColor={editColor}
                setEditName={setEditName}
                setEditIcon={setEditIcon}
                setEditColor={setEditColor}
                onEdit={() => handleEdit(cat)}
                onSave={() => handleSave(cat.id)}
                onDelete={() => handleDelete(cat.id)}
                onCancel={() => setEditingId(null)}
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

function CategoryRow({ category, count, editing, editName, editIcon, editColor, setEditName, setEditIcon, setEditColor, onEdit, onSave, onDelete, onCancel }: any) {
  const iconNode = ICONS[category.iconName] || <Receipt />;

  if (editing) {
    return (
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-highlight/40 dark:bg-slate-800/80 border border-primary/30 mb-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className={`size-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-sm ${editColor}`}>
            {React.cloneElement((ICONS[editIcon] || <Receipt />) as React.ReactElement, { size: 24 })}
          </div>
          <input 
            autoFocus
            type="text" 
            value={editName} 
            onChange={e => setEditName(e.target.value)} 
            className="flex-1 bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 text-text-dark dark:text-white font-bold"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map(opt => (
            <button key={opt.name} onClick={() => setEditIcon(opt.name)} className={`size-9 rounded-xl flex items-center justify-center transition-all ${editIcon === opt.name ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-slate-900 text-secondary'}`}>
              {React.cloneElement(opt.icon as React.ReactElement, { size: 18 })}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(opt => (
            <button key={opt.name} onClick={() => setEditColor(opt.value)} className={`size-7 rounded-full transition-all ${opt.value.split(' ')[0].replace('text-', 'bg-')} ${editColor === opt.value ? 'ring-2 ring-primary scale-110' : 'opacity-60 hover:opacity-100'}`} />
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border dark:border-slate-700">
          <button onClick={onSave} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20"><Check size={18} /> Save</button>
          <button onClick={onDelete} className="p-3 text-rose-500 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 transition-colors"><Trash size={18} /></button>
          <button onClick={onCancel} className="p-3 text-secondary bg-white dark:bg-slate-900 rounded-xl hover:bg-highlight transition-colors"><X size={18} /></button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onEdit} className="flex items-center gap-4 group cursor-pointer p-4 rounded-2xl hover:bg-highlight/50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-border/50">
      <div className={`size-12 rounded-2xl bg-input-bg dark:bg-slate-800 flex items-center justify-center shrink-0 ${category.color} transition-transform group-hover:scale-105`}>
        {React.cloneElement(iconNode as React.ReactElement, { size: 24 })}
      </div>
      <div className="flex-1 flex justify-between items-center">
        <div>
          <p className="text-text-dark dark:text-slate-100 font-extrabold text-[15px]">{category.name}</p>
          <p className="text-text-secondary dark:text-slate-500 text-[11px] font-bold uppercase tracking-tight mt-0.5">{count} transactions</p>
        </div>
        <div className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={20} />
        </div>
      </div>
    </div>
  );
}
