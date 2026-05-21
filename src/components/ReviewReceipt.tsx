import React, { useState } from 'react';
import { ChevronLeft, BadgeCheck, Banknote, Calendar, Camera, CheckCircle, FileEdit, Store, Tag } from 'lucide-react';
import { ViewState, Transaction } from '../App';
import { captureReceiptPhoto, lightHaptic } from '../lib/device';
import {
  createLocalReceiptDraft,
  saveLocalReceiptDraft,
  syncPendingTransactions,
  type LocalReceiptDraft,
} from '../lib/supabase';
import { parseReceiptImage } from '../lib/ocr';

export function ReviewReceipt({
  onNavigate,
  onAddTransaction,
}: Readonly<{
  onNavigate: (v: ViewState, payload?: any) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void | Promise<void>;
}>) {
  const [receiptImage, setReceiptImage] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [receiptDraft, setReceiptDraft] = useState<LocalReceiptDraft | null>(null);
  const [statusMessage, setStatusMessage] = useState('ตรวจทานเองได้ ไม่บังคับใช้ OCR');

  const handleCapture = async () => {
    const image = await captureReceiptPhoto();
    if (!image) return;

    setReceiptImage(image);
    setStatusMessage('กำลังอ่านข้อมูลด้วย AI...');

    // Run OCR in parallel with saving draft
    const ocrPromise = parseReceiptImage(image);

    const draft = createLocalReceiptDraft({
      imageDataUrl: image,
      parsedMerchant: merchant.trim() || undefined,
      parsedAmount: Number(amount) > 0 ? Number(amount) : null,
      parsedDate: date,
    });

    const savedDraft = await saveLocalReceiptDraft(draft);
    setReceiptDraft(savedDraft);

    // Wait for OCR and update state
    const parsed = await ocrPromise;
    if (parsed) {
      setMerchant(parsed.merchant);
      setAmount(parsed.amount.toString());
      setDate(parsed.date);
      setCategory(parsed.category);
      setStatusMessage(`AI อ่านเรียบร้อย (ความมั่นใจ ${Math.round(parsed.confidence * 100)}%)`);
    } else {
      setStatusMessage('บันทึกสลิปแล้ว จะตรวจทานต่อหรือจบเลยก็ได้');
    }

    syncPendingTransactions()
      .then((result) => {
        if (result.receipts?.failed.length) {
          setStatusMessage('บันทึกในเครื่องแล้ว รูปจะซิงก์เมื่อเครือข่ายพร้อม');
        }
      })
      .catch(() => setStatusMessage('บันทึกในเครื่องแล้ว รูปจะซิงก์ภายหลัง'));
  };

  const handleAiScan = async () => {
    if (!receiptImage) return;
    setStatusMessage('กำลังวิเคราะห์ใหม่ด้วย AI...');
    const parsed = await parseReceiptImage(receiptImage);
    if (parsed) {
      setMerchant(parsed.merchant);
      setAmount(parsed.amount.toString());
      setDate(parsed.date);
      setCategory(parsed.category);
      setStatusMessage(`AI วิเคราะห์ใหม่เรียบร้อย (${Math.round(parsed.confidence * 100)}%)`);
    } else {
      setStatusMessage('AI ไม่สามารถอ่านข้อมูลได้ โปรดลองอีกครั้ง');
    }
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
      merchant: merchant.trim() || category.trim() || 'สลิป',
      note: note.trim() || (receiptDraft ? `สลิปแบบร่าง: ${receiptDraft.id}` : ''),
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
          className="size-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-secondary hover:text-text-dark transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-10 text-text-dark dark:text-white">
          ตรวจสลิป
        </h1>
      </header>

      <main className="flex-1 w-full p-4 space-y-5 overflow-y-auto">
        <section className="space-y-3">
          <h3 className="text-sm font-extrabold text-text-dark dark:text-white">ถ่ายสลิปแบบเร็ว</h3>
          <button
            onClick={handleCapture}
            className="relative w-full bg-input-bg dark:bg-slate-800 rounded-[1.35rem] overflow-hidden shadow-sm border border-border aspect-[4/5] flex items-center justify-center"
          >
            {receiptImage ? (
              <img className="w-full h-full object-cover" src={receiptImage} alt="รูปสลิป" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-secondary">
                <Camera size={44} />
                <span className="text-sm font-extrabold">ถ่ายรูปและบันทึกแบบร่าง</span>
              </div>
            )}
          </button>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-secondary text-sm italic font-medium">
              <BadgeCheck size={16} className="text-primary" />
              {statusMessage}
            </div>
            {receiptImage && (
              <button
                onClick={handleAiScan}
                className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-secondary hover:text-primary transition-colors"
              >
                Scan with AI
              </button>
            )}
          </div>
          {receiptDraft && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold py-3 rounded-2xl active:scale-[0.98] transition-all"
            >
              เสร็จแล้ว
            </button>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-extrabold text-text-dark dark:text-white">รายละเอียดสำหรับบันทึกเป็นรายการ</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-[1.35rem] p-5 shadow-sm border border-border dark:border-slate-800 space-y-5">
            <EditableRow
              icon={<Store />}
              label="ร้านค้า"
              value={merchant}
              onChange={setMerchant}
              placeholder="ชื่อร้าน"
            />
            <EditableRow
              icon={<Banknote />}
              label="จำนวนเงิน"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
              inputMode="decimal"
            />
            <EditableRow icon={<Calendar />} label="วันที่" value={date} onChange={setDate} type="date" />
            <EditableRow icon={<Tag />} label="หมวดหมู่" value={category} onChange={setCategory} placeholder="อาหาร" />
            <EditableRow icon={<FileEdit />} label="หมายเหตุ" value={note} onChange={setNote} placeholder="ไม่บังคับ" />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || Number(amount) <= 0}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40"
          >
            <CheckCircle size={20} />
            {saving ? 'กำลังบันทึก...' : 'ยืนยันและบันทึก'}
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
}: Readonly<{
  icon: React.ReactElement;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}>) {
  return (
    <label className="flex items-center gap-4">
      <div className="size-12 bg-input-bg dark:bg-slate-800 rounded-2xl flex items-center justify-center text-secondary shrink-0">
        {React.cloneElement(icon, { size: 22, strokeWidth: 1.5 })}
      </div>
      <div className="flex-1">
        <p className="text-[11px] text-secondary font-semibold">{label}</p>
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
