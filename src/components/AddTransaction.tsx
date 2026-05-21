import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Coffee,
  Utensils,
  Car,
  Receipt,
  ShoppingBag,
  Banknote,
  Gift,
  Shield,
  ChevronDown,
  Calendar,
  Tag,
  Plus,
  CreditCard,
  Wallet,
  Smartphone,
  Sparkles,
  ArrowRight,
  Wand2,
  Camera,
  Landmark,
  ChevronLeft,
} from 'lucide-react';
import { ViewState, Transaction, TransactionType } from '../App';
import { getCurrencySymbol } from '../lib/formatters';
import { getLocalCategories, type LocalCategory } from '../lib/supabase';
import { SMART_INPUT_PREFILL_KEY, type SmartInputPrefill } from '../lib/smartInput';
import { parseSmartInput, toTransactionDraft } from '../lib/smartInput';
import { parseLocalDate } from '../lib/dateUtils';
import { lightHaptic } from '../lib/device';
import { getTranslation } from '../lib/i18n';
import { ICONS, getCategoryColorStyles } from '../lib/categoryUtils';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'เงินสด', icon: <Banknote size={18} strokeWidth={1.5} /> },
  { id: 'bank', label: 'โอนธนาคาร', icon: <Landmark size={18} strokeWidth={1.5} /> },
  { id: 'card', label: 'บัตรเครดิต', icon: <CreditCard size={18} strokeWidth={1.5} /> },
  { id: 'ewallet', label: 'วอลเล็ต', icon: <Wallet size={18} strokeWidth={1.5} /> },
  { id: 'promptpay', label: 'PromptPay', icon: <Smartphone size={18} strokeWidth={1.5} /> },
];

const QUICK_ADD_TYPE_KEY = 'quick_add_type';

export function AddTransaction({
  onNavigate,
  onAddTransaction,
  returnView = 'dashboard',
  lang,
  currency,
}: Readonly<{
  onNavigate: (v: ViewState, payload?: any) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void | Promise<void>;
  returnView?: ViewState;
  lang?: 'th' | 'en';
  currency?: string;
}>) {
  const t = getTranslation(lang || 'th');
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [amount, setAmount] = useState('0');
  const [type, setType] = useState<TransactionType>('Expense');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [userCategories, setUserCategories] = useState<LocalCategory[]>([]);
  const currencySymbol = getCurrencySymbol(undefined, currency);

  const displayAmount = React.useMemo(() => {
    if (amount === '0' || amount === '') return '0';
    const [integerPart, decimalPart] = amount.split('.');
    const formattedInteger = Number.parseInt(integerPart || '0', 10).toLocaleString('en-US');
    return decimalPart === undefined ? formattedInteger : `${formattedInteger}.${decimalPart}`;
  }, [amount]);

  // AI mode state
  const [aiText, setAiText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiHint, setAiHint] = useState(
    lang === 'en' ? 'Type e.g. "Coffee 65 credit card"' : 'พิมพ์รายการ เช่น "กาแฟ 65 บัตรเครดิต"',
  );

  useEffect(() => {
    const handleSessionPreset = () => {
      const presetType = globalThis.sessionStorage.getItem(QUICK_ADD_TYPE_KEY);
      if (presetType === 'Expense' || presetType === 'Income') {
        setType(presetType);
      }
      globalThis.sessionStorage.removeItem(QUICK_ADD_TYPE_KEY);
    };

    const handleSessionPrefill = () => {
      const rawPrefill = globalThis.sessionStorage.getItem(SMART_INPUT_PREFILL_KEY);
      if (!rawPrefill) return;

      const prefill = JSON.parse(rawPrefill) as SmartInputPrefill;
      if (prefill.type === 'Expense' || prefill.type === 'Income') setType(prefill.type);
      if (prefill.amount && prefill.amount > 0) setAmount(String(prefill.amount));
      if (prefill.category) setCategory(prefill.category);
      if (prefill.note || prefill.rawText) setNote(prefill.note || prefill.rawText);
      if (prefill.date) setDate(prefill.date.slice(0, 10));
      if (prefill.paymentMethod) setPaymentMethod(prefill.paymentMethod);
      globalThis.sessionStorage.removeItem(SMART_INPUT_PREFILL_KEY);
    };

    const handlePrefill = () => {
      try {
        handleSessionPreset();
        handleSessionPrefill();
      } catch {
        // Ignore storage errors.
      }
    };
    handlePrefill();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setUserCategories(await getLocalCategories());
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    };

    loadCategories();
    globalThis.addEventListener('joddi:categories-changed', loadCategories);
    return () => globalThis.removeEventListener('joddi:categories-changed', loadCategories);
  }, []);

  const filteredCategories = userCategories.filter((cat) => cat.type === type);

  useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some((c) => c.name === category)) {
      setCategory(filteredCategories[0].name);
    }
  }, [type, filteredCategories]);

  const handleKeyPress = (num: string) => {
    lightHaptic();
    setAmount((prev) => {
      if (num === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      if (prev === '0') return num;

      // Limit to 2 decimal places
      if (prev.includes('.')) {
        const [, decimal] = prev.split('.');
        if (decimal && decimal.length >= 2) return prev;
      }

      return prev + num;
    });
  };

  const handleDelete = () => {
    lightHaptic();
    if (amount.length <= 1) {
      setAmount('0');
    } else {
      setAmount((prev) => prev.slice(0, -1));
    }
  };

  const handleSave = async () => {
    const val = Number.parseFloat(amount);
    if (val === 0) return;

    // Standardize to local ISO string
    const isoDate = parseLocalDate(date).toISOString();

    await onAddTransaction({
      type,
      amount: val,
      category: category || (type === 'Expense' ? 'อื่น ๆ' : 'รายรับ'),
      note,
      date: isoDate,
      merchant: note || category,
      paymentMethod,
    });
    try {
      globalThis.sessionStorage.removeItem(QUICK_ADD_TYPE_KEY);
    } catch {
      // Ignore non-critical storage errors.
    }
    onNavigate(returnView);
  };

  const handleAiSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = aiText.trim();
    if (!text || aiParsing) return;

    setAiParsing(true);
    try {
      const categories = await getLocalCategories();
      const parsed = await parseSmartInput(text, categories);
      const draft = toTransactionDraft(parsed);

      if (!parsed.needsReview && parsed.amount && parsed.amount > 0) {
        await lightHaptic();
        await onAddTransaction(draft);
        setAiText('');
        setAiHint('บันทึกแล้ว ✓');
        globalThis.setTimeout(() => onNavigate(returnView), 600);
        return;
      }

      // Prefill the manual form with parsed data
      if (parsed.type === 'Expense' || parsed.type === 'Income') setType(parsed.type);
      if (parsed.amount && parsed.amount > 0) setAmount(String(parsed.amount));
      if (parsed.category) setCategory(parsed.category);
      if (parsed.note || text) setNote(parsed.note || text);
      if (parsed.date) setDate(parsed.date.slice(0, 10));
      if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
      setMode('manual');
      setAiHint('กรอกข้อมูลเพิ่มเติมแล้วกดบันทึก');
    } catch (error) {
      console.error('Smart input failed:', error);
      setAiHint('อ่านรายการไม่สำเร็จ ลองกรอกเอง');
      setMode('manual');
    } finally {
      setAiParsing(false);
    }
  };

  const closePanel = () => {
    try {
      globalThis.sessionStorage.removeItem(QUICK_ADD_TYPE_KEY);
    } catch {
      // Ignore non-critical storage errors.
    }
    onNavigate(returnView);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-background-dark rounded-t-[2rem] shadow-2xl overflow-hidden border-t border-border dark:border-slate-800">
      {/* Header with close & mode toggle */}
      <div className="pt-5 px-4 pb-3 safe-top bg-slate-50 dark:bg-slate-900/50">
        <div className="flex justify-between items-center mb-4 px-1">
          <button
            onClick={closePanel}
            className="size-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm text-secondary hover:text-text-dark transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Mode Toggle: Manual / AI */}
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-border/60 dark:border-slate-700">
            <button
              onClick={() => setMode('manual')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'manual' ? 'bg-primary text-white shadow-sm' : 'text-secondary'}`}
            >
              กรอกเอง
            </button>
            <button
              onClick={() => setMode('ai')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${mode === 'ai' ? 'bg-primary text-white shadow-sm' : 'text-secondary'}`}
            >
              <Wand2 size={12} />
              AI
            </button>
          </div>

          <button
            onClick={() => onNavigate('review_receipt')}
            className="size-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-sm text-primary hover:text-primary-dark transition-colors"
            aria-label="สแกนสลิป"
          >
            <Camera size={20} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex justify-center">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-border/60 dark:border-slate-700">
            <button
              onClick={() => setType('Expense')}
              className={`px-5 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 ${type === 'Expense' ? 'bg-expense text-white shadow-sm' : 'text-secondary hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              รายจ่าย
            </button>
            <button
              onClick={() => setType('Income')}
              className={`px-5 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 ${type === 'Income' ? 'bg-income text-white shadow-sm' : 'text-secondary hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              รายรับ
            </button>
          </div>
        </div>
      </div>

      {mode === 'ai' ? (
        /* AI Smart Input Mode */
        <div className="flex-1 flex flex-col px-5 pt-6">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
              <Sparkles size={28} />
            </div>
            <h3 className="text-lg font-extrabold text-text-dark dark:text-white mb-1">เพิ่มด้วย AI</h3>
            <p className="text-xs text-secondary font-medium mb-6">{aiHint}</p>

            <form onSubmit={handleAiSubmit} className="w-full max-w-sm">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-border/60 dark:border-slate-700 focus-within:border-primary/40 transition-all">
                <Sparkles className="text-primary shrink-0" size={18} />
                <input
                  value={aiText}
                  disabled={aiParsing}
                  onChange={(event) => setAiText(event.target.value)}
                  placeholder="เช่น กาแฟ 120 วันนี้ บัตรเครดิต"
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-text-dark dark:text-white outline-none placeholder:text-secondary/40"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={aiParsing || aiText.trim().length === 0}
                  className="size-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
                  aria-label="บันทึกรายการด้วย AI"
                >
                  {aiParsing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Manual Input Mode */
        <>
          {/* Amount Display */}
          <div
            className={`px-4 py-6 transition-colors duration-300 ${type === 'Expense' ? 'bg-expense/5 dark:bg-expense/10' : 'bg-income/5 dark:bg-income/10'}`}
          >
            <div className="text-center">
              <p className="text-secondary text-xs font-semibold mb-2 opacity-70">{t.amount_placeholder}</p>
              <div className="flex items-center justify-center gap-2">
                <span className={`text-3xl font-black ${type === 'Expense' ? 'text-expense' : 'text-income'}`}>
                  {currencySymbol}
                </span>
                <span className="text-5xl font-black tracking-tighter text-text-dark dark:text-white transition-all tabular-nums whitespace-nowrap overflow-hidden max-w-full">
                  {displayAmount}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 space-y-6 bg-white dark:bg-background-dark pt-5">
            <section>
              <div className="flex justify-between items-center mb-3 px-1">
                <p className="text-[11px] text-secondary font-semibold">{t.category}</p>
                <button
                  onClick={() => onNavigate('categories')}
                  className="text-primary hover:text-text-dark transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredCategories.map((cat) => (
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

            <div className="grid grid-cols-1 gap-4 pb-16">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl group border border-transparent focus-within:border-primary/20 transition-all">
                <Calendar
                  className="text-secondary group-focus-within:text-primary transition-colors shrink-0"
                  size={18}
                />
                <div className="flex-1">
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-0.5 opacity-50">
                    {t.date}
                  </p>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-[14px] font-bold text-text-dark dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl group border border-transparent focus-within:border-primary/20 transition-all">
                <Tag className="text-secondary group-focus-within:text-primary transition-colors shrink-0" size={18} />
                <div className="flex-1">
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-0.5 opacity-50">
                    {t.note}
                  </p>
                  <input
                    type="text"
                    placeholder="รายการนี้คืออะไร?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-[14px] font-bold text-text-dark dark:text-white placeholder:text-secondary/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-secondary font-semibold px-1">วิธีชำระเงิน</p>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
                        paymentMethod === method.id
                          ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-transparent text-secondary hover:border-slate-200'
                      }`}
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
          <div className="bg-slate-50 dark:bg-slate-900/80 backdrop-blur-md p-4 safe-bottom border-t border-border/60 dark:border-slate-800">
            <div className="grid grid-cols-4 gap-2.5 max-w-sm mx-auto">
              <div className="col-span-3 grid grid-cols-3 gap-2.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'].map((key) => (
                  <button
                    key={key}
                    onClick={() => (key === 'delete' ? handleDelete() : handleKeyPress(key))}
                    className="h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-text-dark dark:text-white shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition-all transition-transform duration-100"
                  >
                    {key === 'delete' ? <ChevronDown className="rotate-90" /> : key}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={Number.parseFloat(amount) === 0}
                className={`flex items-center justify-center rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-30 ${type === 'Expense' ? 'bg-expense text-white shadow-expense/20' : 'bg-income text-white shadow-income/20'}`}
              >
                <Check size={28} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CategoryChip({
  icon,
  label,
  color,
  selected,
  onClick,
}: Readonly<{
  icon: string;
  label: string;
  color: string;
  selected: boolean;
  onClick: () => void;
  key?: React.Key;
}>) {
  const iconNode = ICONS[icon] || <Tag size={16} />;
  const colorStyles = getCategoryColorStyles(color);

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all border whitespace-nowrap active:scale-95 ${
        selected
          ? `bg-white dark:bg-slate-800 border-primary shadow-md shadow-primary/10 ring-1 ring-primary/20`
          : 'bg-slate-50 dark:bg-slate-800/40 border-transparent text-secondary hover:border-slate-200'
      }`}
    >
      <span className={selected ? '' : 'opacity-70'} style={colorStyles.style}>
        {React.cloneElement(iconNode as React.ReactElement, { size: 16 })}
      </span>
      <span className="text-[13px] font-extrabold">{label}</span>
    </button>
  );
}
