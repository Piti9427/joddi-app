import React, { useMemo, useState, useEffect } from 'react';
import {
  Plus,
  Coffee,
  Utensils,
  Car,
  Receipt,
  ShoppingBag,
  Banknote,
  Gift,
  Shield,
  MoreHorizontal,
  X,
  Trash,
  Check,
  Tag,
  BrainCircuit,
  Sparkles,
  ScanLine,
  WalletCards,
  Landmark,
  Smartphone,
  ChartNoAxesCombined,
  Home,
  Bus,
  PlugZap,
  Shirt,
  ShoppingCart,
  Wallet,
  CircleDollarSign,
  HandCoins,
  TrendingUp,
  Briefcase,
  Gamepad2,
  Music,
  Plane,
  Camera,
  Trophy,
  Star,
  HeartPulse,
  Activity,
  GraduationCap,
  Baby,
  Dog,
  Users,
  Wifi,
  Zap,
  Key,
  Hammer,
  Scissors,
} from 'lucide-react';
import { ViewState, Transaction } from '../App';
import {
  createLocalCategory,
  deleteLocalCategory,
  getLocalCategories,
  saveLocalCategories,
  syncAllOfflineData,
  type LocalCategory,
} from '../lib/supabase';

export type Category = LocalCategory;

const ICON_OPTIONS = [
  { name: 'Coffee', icon: <Coffee size={20} /> },
  { name: 'Utensils', icon: <Utensils size={20} /> },
  { name: 'Car', icon: <Car size={20} /> },
  { name: 'Bus', icon: <Bus size={20} /> },
  { name: 'Home', icon: <Home size={20} /> },
  { name: 'PlugZap', icon: <PlugZap size={20} /> },
  { name: 'Receipt', icon: <Receipt size={20} /> },
  { name: 'ShoppingBag', icon: <ShoppingBag size={20} /> },
  { name: 'ShoppingCart', icon: <ShoppingCart size={20} /> },
  { name: 'Shirt', icon: <Shirt size={20} /> },
  { name: 'Wallet', icon: <Wallet size={20} /> },
  { name: 'Banknote', icon: <Banknote size={20} /> },
  { name: 'CircleDollarSign', icon: <CircleDollarSign size={20} /> },
  { name: 'HandCoins', icon: <HandCoins size={20} /> },
  { name: 'TrendingUp', icon: <TrendingUp size={20} /> },
  { name: 'Briefcase', icon: <Briefcase size={20} /> },
  { name: 'Shield', icon: <Shield size={20} /> },
  { name: 'Gift', icon: <Gift size={20} /> },
  { name: 'Gamepad2', icon: <Gamepad2 size={20} /> },
  { name: 'Music', icon: <Music size={20} /> },
  { name: 'Plane', icon: <Plane size={20} /> },
  { name: 'Camera', icon: <Camera size={20} /> },
  { name: 'Trophy', icon: <Trophy size={20} /> },
  { name: 'Star', icon: <Star size={20} /> },
  { name: 'HeartPulse', icon: <HeartPulse size={20} /> },
  { name: 'Activity', icon: <Activity size={20} /> },
  { name: 'GraduationCap', icon: <GraduationCap size={20} /> },
  { name: 'Baby', icon: <Baby size={20} /> },
  { name: 'Dog', icon: <Dog size={20} /> },
  { name: 'Users', icon: <Users size={20} /> },
  { name: 'Smartphone', icon: <Smartphone size={20} /> },
  { name: 'Wifi', icon: <Wifi size={20} /> },
  { name: 'Zap', icon: <Zap size={20} /> },
  { name: 'Key', icon: <Key size={20} /> },
  { name: 'Hammer', icon: <Hammer size={20} /> },
  { name: 'Scissors', icon: <Scissors size={20} /> },
  { name: 'Tag', icon: <Tag size={20} /> },
  { name: 'Sparkles', icon: <Sparkles size={20} /> },
];

const ICONS: Record<string, React.ReactNode> = ICON_OPTIONS.reduce(
  (acc, opt) => ({
    ...acc,
    [opt.name]: opt.icon,
  }),
  {},
);

const COLOR_OPTIONS = [
  { name: 'Rose', value: 'text-rose-500 dark:text-rose-400' },
  { name: 'Pink', value: 'text-pink-500 dark:text-pink-400' },
  { name: 'Fuchsia', value: 'text-fuchsia-500 dark:text-fuchsia-400' },
  { name: 'Purple', value: 'text-purple-500 dark:text-purple-400' },
  { name: 'Violet', value: 'text-violet-500 dark:text-violet-400' },
  { name: 'Indigo', value: 'text-indigo-500 dark:text-indigo-400' },
  { name: 'Blue', value: 'text-blue-500 dark:text-blue-400' },
  { name: 'Sky', value: 'text-sky-500 dark:text-sky-400' },
  { name: 'Cyan', value: 'text-cyan-500 dark:text-cyan-400' },
  { name: 'Teal', value: 'text-teal-500 dark:text-teal-400' },
  { name: 'Emerald', value: 'text-emerald-500 dark:text-emerald-400' },
  { name: 'Green', value: 'text-green-500 dark:text-green-400' },
  { name: 'Lime', value: 'text-lime-500 dark:text-lime-400' },
  { name: 'Yellow', value: 'text-yellow-500 dark:text-yellow-400' },
  { name: 'Amber', value: 'text-amber-500 dark:text-amber-400' },
  { name: 'Orange', value: 'text-orange-500 dark:text-orange-400' },
];

export function CategoriesManagement({
  onNavigate,
  transactions,
}: Readonly<{
  onNavigate: (v: ViewState, payload?: any) => void;
  transactions: Transaction[];
}>) {
  const [categories, setCategories] = useState<LocalCategory[]>([]);
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

  const loadCategories = async () => {
    try {
      setCategories(await getLocalCategories());
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  useEffect(() => {
    loadCategories();
    globalThis.addEventListener('joddi:categories-changed', loadCategories);
    return () => globalThis.removeEventListener('joddi:categories-changed', loadCategories);
  }, []);

  const saveCategories = async (cats: LocalCategory[]) => {
    setCategories(cats);
    await saveLocalCategories(cats);
    syncAllOfflineData().catch((error) => console.error('Category sync error:', error));
  };

  const handleEdit = (cat: LocalCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.iconName);
    setEditColor(cat.color);
    setEditType(cat.type);
    setShowAddForm(false);
  };

  const handleSave = async (id: string) => {
    if (!editName.trim()) return;
    const updated = categories.map((c) =>
      c.id === id
        ? {
            ...c,
            name: editName.trim(),
            iconName: editIcon,
            color: editColor,
            type: editType,
            syncStatus: 'pending' as const,
          }
        : c,
    );
    await saveCategories(updated);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (globalThis.confirm('ลบหมวดหมู่นี้หรือไม่?')) {
      await deleteLocalCategory(id);
      await loadCategories();
      syncAllOfflineData().catch((error) => console.error('Category delete sync error:', error));
      setEditingId(null);
    }
  };

  const handleAddNew = async () => {
    if (!newName.trim()) return;
    const newCat = createLocalCategory({
      name: newName.trim(),
      type: newType,
      iconName: newIcon,
      color: newColor,
    });
    await saveCategories([...categories, newCat]);
    setNewName('');
    setShowAddForm(false);
  };

  const { expenses, incomes } = useMemo(() => {
    const expCounts: { [key: string]: number } = {};
    const incCounts: { [key: string]: number } = {};

    transactions.forEach((t) => {
      if (t.type === 'Expense') {
        expCounts[t.category] = (expCounts[t.category] || 0) + 1;
      } else {
        incCounts[t.category] = (incCounts[t.category] || 0) + 1;
      }
    });

    const exps = categories
      .filter((c) => c.type === 'Expense')
      .map((c) => ({
        ...c,
        count: expCounts[c.name] || 0,
      }));

    const incs = categories
      .filter((c) => c.type === 'Income')
      .map((c) => ({
        ...c,
        count: incCounts[c.name] || 0,
      }));

    return { expenses: exps, incomes: incs };
  }, [transactions, categories]);

  return (
    <div className="flex flex-col min-h-full pb-6 relative bg-background-light dark:bg-background-dark">
      <header
        className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}
      >
        <div className="size-10 shrink-0"></div>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center text-text-dark dark:text-white">หมวดหมู่</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
          }}
          className="text-primary hover:text-text-dark transition-colors p-2 bg-highlight dark:bg-primary/20 rounded-full"
        >
          {showAddForm ? <X size={20} /> : <Plus size={20} />}
        </button>
      </header>

      <main className="p-4 flex flex-col flex-1 space-y-5">
        <section className="ai-surface bg-surface dark:bg-surface-dark rounded-[1.35rem] p-4 border border-border dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-primary">หมวดหมู่พร้อมใช้กับ AI</p>
              <h2 className="text-sm font-extrabold text-text-dark dark:text-white leading-snug">
                ตั้งชื่อหมวดให้ชัดเจน เพื่อให้ช่องเพิ่มอัจฉริยะจัดประเภทได้แม่นขึ้น
              </h2>
            </div>
          </div>
        </section>

        {/* ADD FORM */}
        {showAddForm && (
          <section className="bg-surface dark:bg-surface-dark rounded-[1.35rem] p-5 shadow-xl border-2 border-primary/40 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-extrabold text-primary flex items-center gap-2">สร้างหมวดใหม่</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-secondary hover:text-rose-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                autoFocus
                type="text"
                placeholder="เช่น ของใช้ เกม ค่าเดินทาง"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-input-bg dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 text-text-dark dark:text-white font-bold"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setNewType('Expense')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${newType === 'Expense' ? 'bg-expense text-white shadow-md' : 'bg-input-bg dark:bg-slate-800 text-secondary'}`}
                >
                  รายจ่าย
                </button>
                <button
                  onClick={() => setNewType('Income')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${newType === 'Income' ? 'bg-income text-white shadow-md' : 'bg-input-bg dark:bg-slate-800 text-secondary'}`}
                >
                  รายรับ
                </button>
              </div>

              <div>
                <p className="text-[11px] text-secondary font-semibold mb-2">เลือกไอคอน</p>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => setNewIcon(opt.name)}
                      className={`size-10 rounded-xl flex items-center justify-center transition-all ${newIcon === opt.name ? 'bg-primary text-white scale-110 shadow-md shadow-primary/20' : 'bg-input-bg dark:bg-slate-800 text-secondary'}`}
                    >
                      {React.cloneElement(opt.icon as React.ReactElement, { size: 18 })}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-secondary font-semibold mb-2">เลือกสี</p>
                <div className="grid grid-cols-8 gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => setNewColor(opt.value)}
                      className={`size-8 rounded-full transition-all ${opt.value.split(' ')[0].replace('text-', 'bg-')} ${newColor === opt.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddNew}
                disabled={!newName.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <Check size={20} /> สร้างหมวดหมู่
              </button>
            </div>
          </section>
        )}

        {/* Expenses */}
        <section className="space-y-3">
          <h3 className="text-sm font-extrabold text-secondary pl-2">รายจ่าย ({expenses.length})</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-[1.35rem] p-2 shadow-sm border border-border dark:border-slate-800 space-y-1">
            {expenses.map((cat) => (
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
          <h3 className="text-sm font-extrabold text-secondary pl-2">รายรับ ({incomes.length})</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-[1.35rem] p-2 shadow-sm border border-border dark:border-slate-800 space-y-1">
            {incomes.map((cat) => (
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

function CategoryRow({
  category,
  count,
  editing,
  editName,
  editIcon,
  editColor,
  setEditName,
  setEditIcon,
  setEditColor,
  onEdit,
  onSave,
  onDelete,
  onCancel,
}: Readonly<{
  category: LocalCategory;
  count: number;
  editing: boolean;
  editName: string;
  editIcon: string;
  editColor: string;
  setEditName: (v: string) => void;
  setEditIcon: (v: string) => void;
  setEditColor: (v: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}>) {
  const iconNode = ICONS[category.iconName] || <Receipt />;

  if (editing) {
    return (
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-highlight/40 dark:bg-slate-800/80 border border-primary/30 mb-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div
            className={`size-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-sm ${editColor}`}
          >
            {React.cloneElement((ICONS[editIcon] || <Receipt />) as React.ReactElement, { size: 24 })}
          </div>
          <input
            autoFocus
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 text-text-dark dark:text-white font-bold"
          />
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {ICON_OPTIONS.map((opt) => (
            <button
              key={opt.name}
              onClick={() => setEditIcon(opt.name)}
              className={`size-9 rounded-xl flex items-center justify-center transition-all ${editIcon === opt.name ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-slate-900 text-secondary'}`}
            >
              {React.cloneElement(opt.icon as React.ReactElement, { size: 16 })}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-8 gap-2">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.name}
              onClick={() => setEditColor(opt.value)}
              className={`size-7 rounded-full transition-all ${opt.value.split(' ')[0].replace('text-', 'bg-')} ${editColor === opt.value ? 'ring-2 ring-primary scale-110' : 'opacity-60 hover:opacity-100'}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border dark:border-slate-700">
          <button
            onClick={onSave}
            className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20"
          >
            <Check size={18} /> บันทึก
          </button>
          <button
            onClick={onDelete}
            className="p-3 text-rose-500 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 transition-colors"
          >
            <Trash size={18} />
          </button>
          <button
            onClick={onCancel}
            className="p-3 text-secondary bg-white dark:bg-slate-900 rounded-xl hover:bg-highlight transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onEdit}
      className="w-full text-left flex items-center gap-4 group cursor-pointer p-4 rounded-2xl hover:bg-highlight/50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-border/50"
    >
      <div
        className={`size-12 rounded-2xl bg-input-bg dark:bg-slate-800 flex items-center justify-center shrink-0 ${category.color} transition-transform group-hover:scale-105`}
      >
        {React.cloneElement(iconNode as React.ReactElement, { size: 24 })}
      </div>
      <div className="flex-1 flex justify-between items-center">
        <div>
          <p className="text-text-dark dark:text-slate-100 font-extrabold text-[15px]">{category.name}</p>
          <p className="text-text-secondary dark:text-slate-500 text-[11px] font-semibold mt-0.5">
            ใช้แล้ว {count} รายการ{category.syncStatus === 'synced' ? '' : ` · ${category.syncStatus}`}
          </p>
        </div>
        <div className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={20} />
        </div>
      </div>
    </button>
  );
}
