import React, { useState } from 'react';
import { ArrowLeft, BadgeCheck, Banknote, Calendar, Camera, CheckCircle, FileEdit, Store, Tag } from 'lucide-react';
import { ViewState } from '../App';
import { captureReceiptPhoto, lightHaptic } from '../lib/device';
import {
  createLocalReceiptDraft,
  saveLocalReceiptDraft,
  syncPendingTransactions,
  type LocalReceiptDraft,
} from '../lib/supabase';

export function ReviewReceipt({
  onNavigate,
  onAddTransaction,
}: {
  onNavigate: (v: ViewState) => void;
  onAddTransaction: (t: any) => void | Promise<void>;
}) {
  const [receiptImage, setReceiptImage] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [receiptDraft, setReceiptDraft] = useState<LocalReceiptDraft | null>(null);
  const [statusMessage, setStatusMessage] = useState('Manual review mode, no paid OCR');

  const handleCapture = async () => {
    const image = await captureReceiptPhoto();
    if (!image) return;

    setReceiptImage(image);
    setStatusMessage('Saving receipt draft...');

    const draft = createLocalReceiptDraft({
      imageDataUrl: image,
      parsedMerchant: merchant.trim() || undefined,
      parsedAmount: Number(amount) > 0 ? Number(amount) : null,
      parsedDate: date,
    });

    const savedDraft = await saveLocalReceiptDraft(draft);
    setReceiptDraft(savedDraft);
    setStatusMessage('Receipt draft saved. Review is optional.');

    syncPendingTransactions()
      .then((result) => {
        if (result.receipts?.failed.length) {
          setStatusMessage('Saved locally. Receipt image will sync when network is ready.');
        }
      })
      .catch(() => setStatusMessage('Saved locally. Receipt image will sync later.'));
  };

  const handleSave = async () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    setSaving(true);
    await lightHaptic();
    await onAddTransaction({
      type: 'Expense',
      amount: parsedAmount,
      category: category.trim() || 'Food',
      merchant: merchant.trim() || category.trim() || 'Receipt',
      note: note.trim() || (receiptDraft ? `Receipt draft: ${receiptDraft.id}` : ''),
      date,
      paymentMethod: 'cash',
    });
    setSaving(false);
    onNavigate('dashboard');
  };

  return (
    <div className="flex flex-col min-h-full pb-6 relative bg-background-light dark:bg-background-dark">
      <header
        className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}
      >
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-text-dark dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-input-bg dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-10 text-text-dark dark:text-white">
          Receipt Review
        </h1>
      </header>

      <main className="flex-1 w-full p-6 space-y-8 overflow-y-auto">
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Quick Receipt</h3>
          <button
            onClick={handleCapture}
            className="relative w-full bg-input-bg dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-border aspect-[3/4] flex items-center justify-center"
          >
            {receiptImage ? (
              <img className="w-full h-full object-cover" src={receiptImage} alt="Receipt" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-secondary">
                <Camera size={44} />
                <span className="text-sm font-black uppercase tracking-widest">Capture & Save Draft</span>
              </div>
            )}
          </button>
          <div className="flex items-center gap-2 text-secondary text-sm italic font-medium">
            <BadgeCheck size={16} className="text-primary" />
            {statusMessage}
          </div>
          {receiptDraft && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold py-3 rounded-2xl active:scale-[0.98] transition-all"
            >
              Done
            </button>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Receipt Details</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-border dark:border-slate-800 space-y-5">
            <EditableRow
              icon={<Store />}
              label="Merchant"
              value={merchant}
              onChange={setMerchant}
              placeholder="Store name"
            />
            <EditableRow
              icon={<Banknote />}
              label="Amount"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
              inputMode="decimal"
            />
            <EditableRow icon={<Calendar />} label="Date" value={date} onChange={setDate} type="date" />
            <EditableRow icon={<Tag />} label="Category" value={category} onChange={setCategory} placeholder="Food" />
            <EditableRow icon={<FileEdit />} label="Note" value={note} onChange={setNote} placeholder="Optional note" />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || Number(amount) <= 0}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40"
          >
            <CheckCircle size={20} />
            {saving ? 'Saving...' : 'Confirm & Save'}
          </button>
        </section>
      </main>
    </div>
  );
}

function EditableRow({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
}: {
  icon: React.ReactElement;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <label className="flex items-center gap-4">
      <div className="size-12 bg-input-bg dark:bg-slate-800 rounded-2xl flex items-center justify-center text-secondary shrink-0">
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <div className="flex-1">
        <p className="text-[11px] text-secondary font-bold uppercase tracking-wider">{label}</p>
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-lg font-bold text-text-dark dark:text-slate-100 outline-none placeholder:text-secondary/40"
        />
      </div>
    </label>
  );
}
