import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Plus, Coffee, Utensils, Car, Receipt, ShoppingBag, Banknote, Gift, Shield, MoreHorizontal, X, Trash, Check, Tag, ChevronDown } from 'lucide-react';
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
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('Receipt');
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0].value);
  const [editType, setEditType] = useState<'Expense' | 'Income'>('Expense');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Expense' | 'Income'>('Expense');
  const [newIcon, setNewIcon] = useState('Receipt');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].value);

  useEffect(() => {
    const saved = localStorage.getItem('user_categories');
    if (saved) {
      setCategories(JSON.parse(saved));
    } else {
      setCategories(DEFAULT_CATEGORIES);
      localStorage.setItem('user_categories', JSON.stringify(DEFAULT_CATEGORIES));
    }
  }, []);

  const saveCategories = (cats: Category[]) => {
    setCategories(cats);
    localStorage.setItem('user_categories', JSON.stringify(cats));
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.iconName);
    setEditColor(cat.color);
    setEditType(cat.type);
  };

  const handleSave = (id: string) => {
    if (!editName.trim()) return;
    const updated = categories.map(c => c.id === id ? { ...c, name: editName.trim(), iconName: editIcon, color: editColor, type: editType } : c);
    saveCategories(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
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
    <div className="flex flex-col min-h-full pb-20 relative bg-background-light dark:bg-background-dark">
      <header className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10">
        <button onClick={() => onNavigate('dashboard')} className="text-text-dark dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-input-bg dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-2 text-text-dark dark:text-white">Categories</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="text-primary hover:text-text-dark transition-colors p-2 bg-highlight dark:bg-primary/20 rounded-full">
          {showAddForm ? <X size={20} /> : <Plus size={20} />}
        </button>
      </header>

      <main className="p-4 flex flex-col flex-1 space-y-6">
        
        {/* Add New Category Form */}
        {showAddForm && (
          <section className="bg-surface dark:bg-surface-dark rounded-3xl p-5 shadow-md border-2 border-primary/30 dark:border-primary/40 space-y-4">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2"><Plus size={16} /> Add New Category</h3>
            
            <input 
              autoFocus
              type="text" 
              placeholder="Category name..."
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              className="w-full bg-input-bg dark:bg-slate-800 border border-border dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-dark dark:text-white font-bold text-sm"
            />

            {/* Type selection */}
            <div className="flex gap-2">
              <button onClick={() => setNewType('Expense')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${newType === 'Expense' ? 'bg-expense text-white' : 'bg-input-bg dark:bg-slate-800 text-secondary'}`}>Expense</button>
              <button onClick={() => setNewType('Income')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${newType === 'Income' ? 'bg-income text-white' : 'bg-input-bg dark:bg-slate-800 text-secondary'}`}>Income</button>
            </div>

            {/* Icon selection */}
            <div>
              <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Icon</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {ICON_OPTIONS.map(opt => (
                  <button 
                    key={opt.name} 
                    onClick={() => setNewIcon(opt.name)} 
                    className={`size-10 rounded-xl flex items-center justify-center transition-all ${newIcon === opt.name ? 'bg-primary text-white ring-2 ring-primary/30 scale-110' : 'bg-input-bg dark:bg-slate-800 text-secondary hover:bg-highlight'}`}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selection */}
            <div>
              <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Color</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {COLOR_OPTIONS.map(opt => (
                  <button 
                    key={opt.name} 
                    onClick={() => setNewColor(opt.value)} 
                    className={`size-8 rounded-full flex items-center justify-center transition-all ${opt.value.split(' ')[0].replace('text-', 'bg-')} opacity-80 ${newColor === opt.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>

            <button onClick={handleAddNew} disabled={!newName.trim()} className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <Check size={18} />
              Add Category
            </button>
          </section>
        )}

        {/* Expenses List */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary pl-2">Expense Categories ({expenses.length})</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-3 shadow-sm border border-border dark:border-slate-800 space-y-1">
            {expenses.length === 0 && <p className="text-center text-sm text-secondary py-4">No expense categories yet</p>}
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

        {/* Income List */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary pl-2">Income Categories ({incomes.length})</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-3 shadow-sm border border-border dark:border-slate-800 space-y-1">
            {incomes.length === 0 && <p className="text-center text-sm text-secondary py-4">No income categories yet</p>}
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
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-highlight/30 dark:bg-slate-800/80 transition-colors border border-primary/20">
        <div className="flex items-center gap-3">
          <div className={`size-12 rounded-2xl bg-input-bg dark:bg-slate-800 flex items-center justify-center shrink-0 ${editColor}`}>
            {React.cloneElement((ICONS[editIcon] || <Receipt />) as React.ReactElement, { size: 22 })}
          </div>
          <input 
            autoFocus
            type="text" 
            value={editName} 
            onChange={e => setEditName(e.target.value)} 
            className="flex-1 bg-surface dark:bg-background-dark border border-border dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-dark dark:text-white font-bold"
          />
        </div>
        
        {/* Icon picker row */}
        <div className="flex flex-wrap gap-1.5">
          {ICON_OPTIONS.map(opt => (
            <button 
              key={opt.name} 
              onClick={() => setEditIcon(opt.name)} 
              className={`size-8 rounded-lg flex items-center justify-center transition-all ${editIcon === opt.name ? 'bg-primary text-white scale-110' : 'bg-input-bg dark:bg-slate-700 text-secondary'}`}
            >
              {React.cloneElement(opt.icon as React.ReactElement, { size: 16 })}
            </button>
          ))}
        </div>

        {/* Color picker row */}
        <div className="flex flex-wrap gap-1.5">
          {COLOR_OPTIONS.map(opt => (
            <button 
              key={opt.name} 
              onClick={() => setEditColor(opt.value)} 
              className={`size-7 rounded-full transition-all ${opt.value.split(' ')[0].replace('text-', 'bg-')} opacity-80 ${editColor === opt.value ? 'ring-2 ring-offset-1 ring-primary scale-110' : 'hover:opacity-100'}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button onClick={onSave} className="flex-1 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors"><Check size={16} /> Save</button>
          <button onClick={onDelete} className="py-2 px-4 bg-rose-500/10 text-rose-500 rounded-xl text-sm font-bold hover:bg-rose-500/20 transition-colors"><Trash size={16} /></button>
          <button onClick={onCancel} className="py-2 px-4 bg-input-bg dark:bg-slate-700 text-secondary rounded-xl text-sm font-bold hover:bg-highlight transition-colors"><X size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={onEdit} className="flex items-center gap-4 group cursor-pointer p-3 rounded-2xl hover:bg-input-bg dark:hover:bg-slate-800/50 transition-colors">
      <div className={`size-12 rounded-2xl bg-input-bg dark:bg-slate-800 flex items-center justify-center shrink-0 ${category.color}`}>
        {React.cloneElement(iconNode as React.ReactElement, { size: 22 })}
      </div>
      <div className="flex-1 flex justify-between items-center">
        <div>
          <p className="text-text-dark dark:text-slate-100 font-bold text-[15px]">{category.name}</p>
          <p className="text-text-secondary dark:text-slate-500 text-xs font-medium mt-0.5">{count} transactions</p>
        </div>
        <button className="text-secondary hover:text-text-dark dark:hover:text-white transition-colors p-2">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}
