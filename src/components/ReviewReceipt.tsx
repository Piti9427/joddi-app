import React from 'react';
import { ArrowLeft, ZoomIn, BadgeCheck, Store, Banknote, Calendar, Tag, ChevronDown, CheckCircle, FileEdit, Home, Camera, Receipt, Settings } from 'lucide-react';
import { ViewState } from '../App';

export function ReviewReceipt({ onNavigate, onAddTransaction }: { onNavigate: (v: ViewState) => void; onAddTransaction: (t: any) => void }) {
  const handleSave = () => {
    onAddTransaction({
      type: 'Expense',
      amount: 5.50,
      category: 'Food',
      merchant: 'Starbucks',
      note: 'Coffee & Food',
      date: new Date().toISOString()
    });
    onNavigate('dashboard');
  };

  return (
    <div className="flex flex-col min-h-full pb-20 relative bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10">
        <button onClick={() => onNavigate('dashboard')} className="text-text-dark dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-input-bg dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-10 text-text-dark dark:text-white">Review Receipt</h1>
      </header>

      <main className="flex-1 w-full p-6 space-y-8 overflow-y-auto">
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Receipt Photo</h3>
          <div className="relative group">
            <div className="w-full bg-input-bg dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-border border-transparent aspect-[3/4]">
              <img className="w-full h-full object-cover grayscale-[20%]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzS_lyTOHfc4Amkt0fEmUawALO28I7FwJuhzsOrpzAFSuHRFVlNTmgB8TffhApYvUXCVDensdxD5_9FEgmevgkZT7ihvjhpMz_vxNomqa4BjF_UE6_axiahEaw5Gtn1oarcrg_lOEVbJ8bsZ0NNoadRQSLDBWOxG3lgx98LOMLGdfGkTOjuShFi9G8y-7HB7vblyLoY6-64fyCQpFUYKXaMvwb4rasQwiNMs0DynDxC4Uxtggv_LEd-jwWRPOFk3QjCJ4eqAEzug" alt="Receipt" />
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors"></div>
            </div>
            <button className="absolute bottom-4 right-4 bg-surface/90 dark:bg-surface-dark/90 p-3 rounded-full shadow-lg text-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform backdrop-blur-sm">
              <ZoomIn size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-secondary text-sm italic font-medium">
            <BadgeCheck size={16} className="text-primary" />
            Scanned moments ago
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">Extracted Details</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-border dark:border-slate-800 space-y-6">
            <DetailRow icon={<Store />} label="Merchant" value="Starbucks" />
            <DetailRow icon={<Banknote />} label="Amount" value="$5.50" />
            <DetailRow icon={<Calendar />} label="Date" value="Today" />
            
            {/* Category Suggestion */}
            <div className="flex items-center gap-4 pt-2 mt-4 border-t border-input-bg dark:border-slate-800">
              <div className="size-12 bg-highlight/50 dark:bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <Tag size={22} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-secondary font-bold uppercase tracking-wider">Suggested Category</p>
                <div className="mt-1">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-highlight dark:bg-primary/20 text-primary uppercase tracking-wide">
                    Coffee & Food
                  </span>
                </div>
              </div>
              <button className="text-secondary hover:text-primary transition-colors p-2 bg-input-bg dark:bg-slate-800 rounded-full">
                <ChevronDown size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6">
            <button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              <CheckCircle size={20} />
              Confirm & Save
            </button>
            <button className="w-full bg-surface dark:bg-surface-dark border border-border dark:border-slate-700 hover:border-primary text-text-dark dark:text-slate-200 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              <FileEdit size={20} className="text-secondary" />
              Edit All Details
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function DetailRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="size-12 bg-input-bg dark:bg-slate-800 rounded-2xl flex items-center justify-center text-secondary shrink-0">
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <div className="flex-1">
        <p className="text-[11px] text-secondary font-bold uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-text-dark dark:text-slate-100">{value}</p>
      </div>
      <button className="text-secondary hover:text-primary transition-colors">
        <FileEdit size={18} />
      </button>
    </div>
  );
}

