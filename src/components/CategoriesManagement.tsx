import React, { useMemo, useState, useEffect } from 'react';
import { Plus, MoreHorizontal, X, Trash, Check, Pipette, ChevronLeft, Receipt, Sparkles } from 'lucide-react';
import { ViewState, Transaction } from '../App';
import {
  createLocalCategory,
  deleteLocalCategory,
  getLocalCategories,
  saveLocalCategories,
  syncAllOfflineData,
  type LocalCategory,
} from '../lib/supabase';
import { ICON_OPTIONS, ICONS, COLOR_OPTIONS, getCategoryColorStyles, isHex } from '../lib/categoryUtils';

export type Category = LocalCategory;

interface CategoryRowProps {
  key?: string;
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
}: Readonly<CategoryRowProps>) {
  const iconNode = ICONS[category.iconName] || <Receipt />;
  const colorStyles = getCategoryColorStyles(category.color);
  const editColorStyles = getCategoryColorStyles(editColor);

  if (editing) {
    return (
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-highlight/40 dark:bg-white/5 border border-primary/30 mb-2 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div
            className={`size-12 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center shrink-0 shadow-sm ${editColorStyles.className}`}
            style={editColorStyles.style}
          >
            {React.cloneElement((ICONS[editIcon] || <Receipt />) as React.ReactElement, { size: 24 })}
          </div>
          <input
            autoFocus
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 bg-white dark:bg-white/5 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/50 text-text-dark dark:text-white font-bold"
          />
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {ICON_OPTIONS.map((opt) => (
            <button
              key={opt.name}
              onClick={() => setEditIcon(opt.name)}
              className={`size-9 rounded-xl flex items-center justify-center transition-all ${editIcon === opt.name ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-white/5 text-secondary'}`}
            >
              {React.cloneElement(opt.icon as React.ReactElement, { size: 16 })}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.name}
              onClick={() => setEditColor(opt.text)}
              className={`size-7 rounded-full transition-all ${opt.bg} ${editColor === opt.text ? 'ring-2 ring-primary scale-110 shadow-md' : 'opacity-60 hover:opacity-100'}`}
            />
          ))}
          <div className="relative size-7">
            <input
              type="color"
              id={`color-picker-${category.id}`}
              value={isHex(editColor) ? editColor : '#3b82f6'}
              onChange={(e) => setEditColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <button
              onClick={() => document.getElementById(`color-picker-${category.id}`)?.click()}
              className={`size-7 rounded-full flex items-center justify-center border-2 border-dashed border-secondary/30 hover:border-primary transition-all ${isHex(editColor) ? 'ring-2 ring-primary scale-110' : ''}`}
              style={isHex(editColor) ? { backgroundColor: editColor } : {}}
            >
              {!isHex(editColor) && <Pipette size={14} className="text-secondary" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border dark:border-white/5">
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
            className="p-3 text-secondary bg-white dark:bg-white/5 rounded-xl hover:bg-highlight transition-colors"
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
      className="w-full text-left flex items-center gap-4 group cursor-pointer p-4 rounded-2xl hover:bg-highlight/50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-border/50"
    >
      <div
        className={`size-12 rounded-2xl bg-input-bg dark:bg-white/5 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${colorStyles.className}`}
        style={colorStyles.style}
      >
        {React.cloneElement(iconNode as React.ReactElement, { size: 24 })}
      </div>
      <div className="flex-1 flex justify-between items-center">
        <div>
          <p className="text-text-dark dark:text-slate-100 font-extrabold text-[15px]">{category.name}</p>
          <p className="text-text-secondary dark:text-white/60 text-[11px] font-semibold mt-0.5">
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
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0].text);
  const [editType, setEditType] = useState<'Expense' | 'Income'>('Expense');

  // Add states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'Expense' as 'Expense' | 'Income',
    icon: 'Receipt',
    color: COLOR_OPTIONS[0].text,
  });

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

  const handleCreate = async () => {
    if (!newCategory.name.trim()) return;
    const newCat = createLocalCategory({
      name: newCategory.name.trim(),
      type: newCategory.type,
      iconName: newCategory.icon,
      color: newCategory.color,
    });
    await saveCategories([...categories, newCat]);
    setNewCategory({ name: '', type: 'Expense', icon: 'Receipt', color: COLOR_OPTIONS[0].text });
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
    <div className="flex flex-col min-h-full pb-32 relative bg-background-light dark:bg-background-dark">
      <header
        className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-white/5 sticky top-0 z-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}
      >
        <button
          onClick={() => onNavigate('dashboard')}
          className="size-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-xl text-secondary hover:text-text-dark transition-colors border border-transparent dark:border-white/5"
        >
          {' '}
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-black leading-tight flex-1 text-center text-text-dark dark:text-white uppercase tracking-[0.1em]">
          หมวดหมู่
        </h1>
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
        <section className="ai-surface bg-surface dark:bg-surface-dark rounded-[1.35rem] p-4 border border-border dark:border-white/5 shadow-sm">
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
                value={newCategory.name}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-input-bg dark:bg-white/5 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 text-text-dark dark:text-white font-bold"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setNewCategory((prev) => ({ ...prev, type: 'Expense' }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${newCategory.type === 'Expense' ? 'bg-expense text-white shadow-md' : 'bg-input-bg dark:bg-white/5 text-secondary'}`}
                >
                  รายจ่าย
                </button>
                <button
                  onClick={() => setNewCategory((prev) => ({ ...prev, type: 'Income' }))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${newCategory.type === 'Income' ? 'bg-income text-white shadow-md' : 'bg-input-bg dark:bg-white/5 text-secondary'}`}
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
                      onClick={() => setNewCategory((prev) => ({ ...prev, icon: opt.name }))}
                      className={`size-10 rounded-xl flex items-center justify-center transition-all ${newCategory.icon === opt.name ? 'bg-primary text-white scale-110 shadow-md shadow-primary/20' : 'bg-input-bg dark:bg-white/5 text-secondary'}`}
                    >
                      {React.cloneElement(opt.icon as React.ReactElement, { size: 18 })}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-secondary font-semibold mb-2">เลือกสี</p>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => setNewCategory((prev) => ({ ...prev, color: opt.text }))}
                      className={`size-8 rounded-full transition-all ${opt.bg} ${newCategory.color === opt.text ? 'ring-2 ring-primary scale-110 shadow-md' : 'opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                  <div className="relative size-8">
                    <input
                      type="color"
                      id="new-category-color-picker"
                      value={isHex(newCategory.color) ? newCategory.color : '#3b82f6'}
                      onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <button
                      onClick={() => document.getElementById('new-category-color-picker')?.click()}
                      className={`size-8 rounded-full flex items-center justify-center border-2 border-dashed border-secondary/30 hover:border-primary transition-all ${isHex(newCategory.color) ? 'ring-2 ring-primary scale-110' : ''}`}
                      style={isHex(newCategory.color) ? { backgroundColor: newCategory.color } : {}}
                    >
                      {!isHex(newCategory.color) && <Pipette size={16} className="text-secondary" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!newCategory.name.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                <Check size={20} /> สร้างหมวดหมู่
              </button>
            </div>
          </section>
        )}

        {/* Expenses */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black text-secondary pl-2 uppercase tracking-[0.2em]">
            รายจ่าย ({expenses.length})
          </h3>
          <div className="bg-surface dark:bg-surface-dark rounded-[1.35rem] p-2 shadow-sm border border-border dark:border-white/5 space-y-1">
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
          <h3 className="text-[10px] font-black text-secondary pl-2 uppercase tracking-[0.2em]">
            รายรับ ({incomes.length})
          </h3>
          <div className="bg-surface dark:bg-surface-dark rounded-[1.35rem] p-2 shadow-sm border border-border dark:border-white/5 space-y-1">
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
