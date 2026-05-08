import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { Transaction, ViewState } from '../App';
import { getLocalCategories } from '../lib/supabase';
import { parseSmartInput, SMART_INPUT_PREFILL_KEY, toTransactionDraft } from '../lib/smartInput';
import { lightHaptic } from '../lib/device';

export function SmartInput({
  onNavigate,
  onAddTransaction,
  disabled = false,
}: {
  onNavigate: (v: ViewState) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void | Promise<void>;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const [parsing, setParsing] = useState(false);
  const [hint, setHint] = useState('เช่น กาแฟ 120 วันนี้ บัตรเครดิต');

  useEffect(() => {
    const endpoint = String(import.meta.env.VITE_SMART_INPUT_ENDPOINT || '').trim();
    setHint(endpoint ? 'พร้อมช่วยอ่านรายการด้วย Gemini เมื่อออนไลน์' : 'อ่านรายการแบบออฟไลน์ได้ทันที');
  }, []);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = value.trim();
    if (!text || disabled || parsing) return;

    setParsing(true);
    try {
      const categories = await getLocalCategories();
      const parsed = await parseSmartInput(text, categories);
      const draft = toTransactionDraft(parsed);

      if (!parsed.needsReview && parsed.amount && parsed.amount > 0) {
        await lightHaptic();
        await onAddTransaction(draft);
        setValue('');
        setHint('บันทึกแล้ว');
        return;
      }

      window.sessionStorage.setItem(
        SMART_INPUT_PREFILL_KEY,
        JSON.stringify({
          ...parsed,
          rawText: text,
        }),
      );
      onNavigate('add_transaction');
    } catch (error) {
      console.error('Smart input failed:', error);
      setHint('อ่านรายการนี้ไม่สำเร็จ ลองกรอกผ่านฟอร์ม');
      onNavigate('add_transaction');
    } finally {
      setParsing(false);
    }
  };

  return (
    <section className="px-4 pt-4">
      <motion.form
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit}
        className="ai-command-surface rounded-[1.35rem] p-3.5 shadow-lg shadow-slate-900/12 text-white"
      >
        <div className="flex items-center gap-2 mb-2.5">
          <div className="size-9 rounded-xl bg-white/12 flex items-center justify-center">
            <Wand2 size={17} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold leading-tight">เพิ่มรายการด้วย AI</h3>
            <p className="text-[11px] font-medium text-white/65">{hint}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-2xl px-3 py-2.5">
          <Sparkles className="text-primary shrink-0" size={18} />
          <input
            value={value}
            disabled={disabled || parsing}
            onChange={(event) => setValue(event.target.value)}
            placeholder="เช่น กาแฟ 120 วันนี้ บัตรเครดิต"
            className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-slate-950 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={disabled || parsing || value.trim().length === 0}
            className="size-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
            aria-label="บันทึกรายการด้วย AI"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.form>
    </section>
  );
}
