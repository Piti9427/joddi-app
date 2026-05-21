import React, { useState, useEffect } from 'react';
import {
  Check,
  Trash2,
  Calendar,
  Tag,
  CreditCard,
  Banknote,
  Landmark,
  Smartphone,
  Wallet,
  ChevronDown,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { ViewState, Transaction, TransactionType } from '../App';
import { getCurrencySymbol } from '../lib/formatters';
import { getLocalCategories, type LocalCategory, saveLocalTransaction, deleteLocalTransaction } from '../lib/supabase';
import { parseLocalDate } from '../lib/dateUtils';
import { lightHaptic } from '../lib/device';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS, getCategoryColorStyles } from '../lib/categoryUtils';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'เงินสด', icon: <Banknote size={18} strokeWidth={1.5} /> },
  { id: 'bank', label: 'โอนธนาคาร', icon: <Landmark size={18} strokeWidth={1.5} /> },
  { id: 'card', label: 'บัตรเครดิต', icon: <CreditCard size={18} strokeWidth={1.5} /> },
  { id: 'ewallet', label: 'วอลเล็ต', icon: <Wallet size={18} strokeWidth={1.5} /> },
  { id: 'promptpay', label: 'PromptPay', icon: <Smartphone size={18} strokeWidth={1.5} /> },
];

export function TransactionDetail({
  transaction,
  onNavigate,
  lang,
  currency,
  onUpdate,
  returnView,
}: Readonly<{
  transaction: Transaction;
  onNavigate: (v: ViewState, payload?: any) => void;
  lang?: 'th' | 'en';
  currency?: string;
  onUpdate: () => void;
  returnView?: ViewState;
}>) {
  const finalReturnView = returnView || 'dashboard';
  // View state
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit state
  const [amount, setAmount] = useState(String(transaction.amount));
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [note, setNote] = useState(transaction.note || '');
  const [date, setDate] = useState(transaction.date.split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(transaction.paymentMethod || 'cash');
  const [toPaymentMethod, setToPaymentMethod] = useState(transaction.toPaymentMethod || 'bank');
  const [userCategories, setUserCategories] = useState<LocalCategory[]>([]);

  const currencySymbol = getCurrencySymbol(undefined, currency);

  useEffect(() => {
    const loadCategories = async () => {
      setUserCategories(await getLocalCategories());
    };
    loadCategories();
  }, []);

  const displayAmount = React.useMemo(() => {
    if (amount === '0' || amount === '') return '0';
    const [integerPart, decimalPart] = amount.split('.');
    const formattedInteger = Number.parseInt(integerPart || '0', 10).toLocaleString('en-US');
    return decimalPart === undefined ? formattedInteger : `${formattedInteger}.${decimalPart}`;
  }, [amount]);

  const filteredCategories = userCategories.filter((cat) => cat.type === type);

  const handleKeyPress = (num: string) => {
    lightHaptic();
    setAmount((prev) => {
      if (num === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      if (prev === '0') return num;
      if (prev.includes('.')) {
        const [, decimal] = prev.split('.');
        if (decimal && decimal.length >= 2) return prev;
      }
      return prev + num;
    });
  };

  const handleBackspace = () => {
    lightHaptic();
    if (amount.length <= 1) setAmount('0');
    else setAmount((prev) => prev.slice(0, -1));
  };

  const handleSave = async () => {
    const val = Number.parseFloat(amount);
    if (val === 0) return;

    // Use parseLocalDate to avoid UTC midnight parsing issues
    const transactionDate = parseLocalDate(date);

    const isTransfer = type === 'Transfer';
    const finalCategory = isTransfer
      ? lang === 'en'
        ? 'Transfer'
        : 'โอนเงิน'
      : category || (type === 'Expense' ? 'อื่น ๆ' : 'รายรับ');

    await saveLocalTransaction({
      ...transaction,
      localId: transaction.localId || transaction.id,
      type,
      amount: val,
      category: finalCategory,
      note,
      date: transactionDate.toISOString(),
      merchant: isTransfer ? (lang === 'en' ? 'Transfer' : 'โอนเงิน') : note || category,
      paymentMethod,
      toPaymentMethod: isTransfer ? toPaymentMethod : undefined,
      syncStatus: 'pending' as const,
    });

    onUpdate();
    setIsEditing(false);
    lightHaptic();
  };

  const handleDelete = async () => {
    await deleteLocalTransaction(transaction.id);
    onUpdate();
    onNavigate(finalReturnView);
    lightHaptic();
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden relative">
      {/* Header */}
      <div className="pt-5 px-4 pb-3 safe-top bg-background-light/85 dark:bg-background-dark/85 backdrop-blur-md flex justify-between items-center border-b border-border/10 dark:border-white/5 sticky top-0 z-10">
        <button
          onClick={() => onNavigate('dashboard')}
          className="size-10 flex items-center justify-center bg-white dark:bg-white/5 rounded-xl shadow-sm text-secondary hover:text-text-dark transition-colors border border-transparent dark:border-white/5"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
          {isEditing ? 'แก้ไขรายการ' : 'รายละเอียด'}
        </h2>
        <div className="size-10" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Amount Section */}
        <div
          className={`px-4 py-8 text-center transition-colors ${
            type === 'Expense'
              ? 'bg-expense/5 dark:bg-white/2'
              : type === 'Transfer'
                ? 'bg-blue-500/5 dark:bg-white/2'
                : 'bg-income/5 dark:bg-white/2'
          }`}
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">ยอดเงิน</p>
          <div className="flex items-center justify-center gap-2">
            <span
              className={`text-2xl font-black ${
                type === 'Expense'
                  ? 'text-text-dark dark:text-white'
                  : type === 'Transfer'
                    ? 'text-blue-500'
                    : 'text-emerald-500'
              }`}
            >
              {currencySymbol}
            </span>
            <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums">
              {displayAmount}
            </span>
          </div>

          {isEditing && (
            <div className="flex justify-center mt-4">
              <div className="flex bg-white dark:bg-white/5 p-1 rounded-xl border border-border/60 dark:border-white/5">
                <button
                  onClick={() => setType('Expense')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'Expense' ? 'bg-expense text-white shadow-sm' : 'text-secondary hover:bg-background-light dark:hover:bg-white/5'}`}
                >
                  รายจ่าย
                </button>
                <button
                  onClick={() => setType('Income')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'Income' ? 'bg-income text-white shadow-sm' : 'text-secondary hover:bg-background-light dark:hover:bg-white/5'}`}
                >
                  รายรับ
                </button>
                <button
                  onClick={() => setType('Transfer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${type === 'Transfer' ? 'bg-blue-500 text-white shadow-sm' : 'text-secondary hover:bg-background-light dark:hover:bg-white/5'}`}
                >
                  โอนเงิน
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 space-y-6">
          {/* Category */}
          {type !== 'Transfer' && (
            <section>
              <p className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] mb-3 px-1">หมวดหมู่</p>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {filteredCategories.map((cat) => {
                    const catColorStyles = getCategoryColorStyles(cat.color);
                    const isSelected = category === cat.name;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.name)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-white dark:bg-white/10 border-primary/40 text-primary shadow-sm ring-1 ring-primary/10'
                            : 'bg-background-light dark:bg-white/5 border-transparent dark:border-white/5 text-secondary'
                        }`}
                      >
                        <div
                          className={`size-4 rounded-full flex items-center justify-center ${isSelected ? '' : 'opacity-60'}`}
                          style={catColorStyles.style}
                        >
                          <span className={catColorStyles.className}>
                            {React.cloneElement((ICONS[cat.iconName] || <Tag />) as React.ReactElement, {
                              size: 10,
                              strokeWidth: 2.5,
                            })}
                          </span>
                        </div>
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 shadow-sm">
                  {(() => {
                    const catObj = userCategories.find((c) => c.name === category);
                    const colorStyles = catObj
                      ? getCategoryColorStyles(catObj.color)
                      : { style: {}, className: 'text-white/60' };
                    const iconNode = (catObj && ICONS[catObj.iconName]) || <Tag size={18} />;
                    return (
                      <>
                        <div
                          className="size-10 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center shadow-sm border border-transparent dark:border-white/5"
                          style={colorStyles.style}
                        >
                          <span className={colorStyles.className}>
                            {React.cloneElement(iconNode as React.ReactElement, { size: 18, strokeWidth: 1.5 })}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{category}</span>
                      </>
                    );
                  })()}
                </div>
              )}
            </section>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Date */}
            <div className="bg-white dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 shadow-sm">
              <p className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mb-1 opacity-50 flex items-center gap-1">
                <Calendar size={12} /> วันที่
              </p>
              {isEditing ? (
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-slate-900 dark:text-white"
                />
              ) : (
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {new Date(date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'long' })}
                </p>
              )}
            </div>

            {/* Note */}
            <div className="bg-white dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 shadow-sm">
              <p className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mb-1 opacity-50">
                หมายเหตุ
              </p>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="เพิ่มหมายเหตุ..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-slate-900 dark:text-white"
                />
              ) : (
                <p className="text-sm font-bold text-slate-900 dark:text-white">{note || '-'}</p>
              )}
            </div>

            {/* Payment Method / Transfer Info */}
            {isEditing ? (
              type === 'Transfer' ? (
                <>
                  {/* Source Wallet Grid */}
                  <div className="bg-white dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 shadow-sm">
                    <p className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mb-3 opacity-50">
                      {lang === 'en' ? 'From (Source Wallet)' : 'โอนจาก (ต้นทาง)'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={`source-${m.id}`}
                          onClick={() => setPaymentMethod(m.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                            paymentMethod === m.id
                              ? 'bg-slate-900 dark:bg-white dark:text-black text-white border-slate-900 dark:border-white shadow-sm'
                              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/60'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Destination Wallet Grid */}
                  <div className="bg-white dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 shadow-sm">
                    <p className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mb-3 opacity-50">
                      {lang === 'en' ? 'To (Destination Wallet)' : 'โอนไปที่ (ปลายทาง)'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={`dest-${m.id}`}
                          onClick={() => setToPaymentMethod(m.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                            toPaymentMethod === m.id
                              ? 'bg-slate-900 dark:bg-white dark:text-black text-white border-slate-900 dark:border-white shadow-sm'
                              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/60'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Single Payment Method */
                <div className="bg-white dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 shadow-sm">
                  <p className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mb-3 opacity-50">
                    {lang === 'en' ? 'Payment Method' : 'วิธีชำระเงิน'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                          paymentMethod === m.id
                            ? 'bg-slate-900 dark:bg-white dark:text-black text-white border-slate-900 dark:border-white shadow-sm'
                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/60'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : type === 'Transfer' ? (
              <>
                {/* Source Wallet */}
                <div className="bg-white dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 shadow-sm">
                  <p className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mb-2 opacity-50">
                    {lang === 'en' ? 'From (Source Wallet)' : 'โอนจาก (ต้นทาง)'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-white/60">
                      {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.icon || <CreditCard size={16} />}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label || paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Destination Wallet */}
                <div className="bg-white dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 shadow-sm">
                  <p className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mb-2 opacity-50">
                    {lang === 'en' ? 'To (Destination Wallet)' : 'โอนไปที่ (ปลายทาง)'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-white/60">
                      {PAYMENT_METHODS.find((m) => m.id === toPaymentMethod)?.icon || <CreditCard size={16} />}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {PAYMENT_METHODS.find((m) => m.id === toPaymentMethod)?.label || toPaymentMethod}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* Single Payment Method */
              <div className="bg-white dark:bg-white/5 p-3.5 rounded-2xl border border-border/40 dark:border-white/5 shadow-sm">
                <p className="text-[9px] text-secondary font-black uppercase tracking-[0.2em] mb-3 opacity-50">
                  {lang === 'en' ? 'Payment Method' : 'วิธีชำระเงิน'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-white/60">
                    {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.icon || <CreditCard size={16} />}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label || paymentMethod}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-text-dark dark:bg-white text-white dark:text-black font-black py-4 rounded-2xl shadow-lg shadow-black/5 active:scale-95 transition-all border-none"
              >
                แก้ไขรายการ
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-rose-50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-400 font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 border border-rose-100/50 dark:border-rose-500/10"
              >
                <Trash2 size={18} />
                ลบรายการนี้
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editing Keypad */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="absolute inset-x-0 bottom-0 bg-background-light dark:bg-black/90 p-4 pb-safe border-t border-border dark:border-white/5 shadow-2xl z-30"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-xs font-bold text-slate-400">แก้ไขจำนวนเงิน</span>
              <button
                onClick={handleSave}
                className="bg-primary text-white px-6 py-2 rounded-xl font-black shadow-lg shadow-primary/10"
              >
                บันทึก
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-3 grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'].map((key) => (
                  <button
                    key={key}
                    onClick={() => (key === 'delete' ? handleBackspace() : handleKeyPress(key))}
                    className="h-12 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-lg font-bold text-slate-900 dark:text-white shadow-sm border border-transparent dark:border-white/5"
                  >
                    {key === 'delete' ? <ChevronDown className="rotate-90" /> : key}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                className="bg-text-dark dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <Check size={28} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-background-dark w-full rounded-3xl p-6 shadow-2xl border border-transparent dark:border-white/5"
            >
              <div className="size-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-lg font-black text-center text-slate-900 dark:text-white mb-2">ลบรายการนี้?</h3>
              <p className="text-sm text-center text-slate-500 mb-6 font-medium">
                คุณไม่สามารถย้อนคืนการลบได้ ข้อมูลนี้จะหายไปจากบัญชีของคุณ
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/80 font-bold py-3 rounded-2xl"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white font-bold py-3 rounded-2xl shadow-lg shadow-red-500/20"
                >
                  ลบทันที
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
