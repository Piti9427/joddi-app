import React from 'react';
import { ArrowLeft, ZoomIn, BadgeCheck, Store, Banknote, Calendar, Tag, ChevronDown, CheckCircle, FileEdit, Home, Camera, Receipt, Settings } from 'lucide-react';
import { ViewState } from '../App';

export function ReviewReceipt({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  return (
    <div className="flex flex-col min-h-full pb-20 relative">
      {/* Header */}
      <header className="flex items-center bg-white dark:bg-slate-900 p-4 border-b border-primary/10 sticky top-0 z-10">
        <button onClick={() => onNavigate('dashboard')} className="text-slate-900 dark:text-slate-100 flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-10">Review Receipt</h1>
      </header>

      <main className="flex-1 w-full p-4 space-y-6 overflow-y-auto">
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Receipt Photo</h3>
          <div className="relative group">
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-primary/10 aspect-[3/4]">
              <img className="w-full h-full object-cover grayscale-[20%]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAzS_lyTOHfc4Amkt0fEmUawALO28I7FwJuhzsOrpzAFSuHRFVlNTmgB8TffhApYvUXCVDensdxD5_9FEgmevgkZT7ihvjhpMz_vxNomqa4BjF_UE6_axiahEaw5Gtn1oarcrg_lOEVbJ8bsZ0NNoadRQSLDBWOxG3lgx98LOMLGdfGkTOjuShFi9G8y-7HB7vblyLoY6-64fyCQpFUYKXaMvwb4rasQwiNMs0DynDxC4Uxtggv_LEd-jwWRPOFk3QjCJ4eqAEzug" alt="Receipt" />
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors"></div>
            </div>
            <button className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-900/90 p-2 rounded-full shadow-lg text-primary flex items-center justify-center">
              <ZoomIn size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm italic">
            <BadgeCheck size={16} />
            Scanned moments ago
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Extracted Details</h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-primary/10 space-y-5">
            <DetailRow icon={<Store />} label="Merchant" value="Starbucks" />
            <DetailRow icon={<Banknote />} label="Amount" value="$5.50" />
            <DetailRow icon={<Calendar />} label="Date" value="Today, Oct 24" />
            <div className="flex items-center gap-4">
              <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <Tag size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">Suggested Category</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary mt-1 uppercase">
                  Coffee & Food
                </span>
              </div>
              <button className="text-slate-400 hover:text-primary transition-colors">
                <ChevronDown size={24} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button onClick={() => onNavigate('dashboard')} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2">
              <CheckCircle size={20} />
              Confirm & Save
            </button>
            <button className="w-full bg-white dark:bg-slate-900 border border-primary/20 hover:border-primary text-primary font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
              <FileEdit size={20} />
              Edit All Details
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-primary/10 px-4 pb-6 pt-2 z-10">
        <div className="flex gap-2">
          <NavItem icon={<Home size={24} />} label="Home" onClick={() => onNavigate('dashboard')} />
          <NavItem icon={<Camera size={24} className="fill-current" />} label="Scan" active />
          <NavItem icon={<Receipt size={24} />} label="Expenses" />
          <NavItem icon={<Settings size={24} />} label="Settings" />
        </div>
      </nav>
    </div>
  );
}

function DetailRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
      <button className="text-slate-400 hover:text-primary transition-colors">
        <FileEdit size={20} />
      </button>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-1 flex-col items-center justify-center gap-1 ${active ? 'text-primary' : 'text-slate-400 hover:text-primary transition-colors'}`}>
      {icon}
      <p className="text-xs font-medium">{label}</p>
    </button>
  );
}
