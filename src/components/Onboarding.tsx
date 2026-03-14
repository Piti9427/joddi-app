import React from 'react';
import { Leaf } from 'lucide-react';
import { ViewState } from '../App';

export function Onboarding({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  return (
    <div className="flex flex-col min-h-full p-6 bg-background-light dark:bg-background-dark">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-primary flex size-10 items-center justify-center rounded-xl bg-highlight dark:bg-primary/20">
            <Leaf size={24} />
          </div>
          <h2 className="text-text-dark dark:text-white text-xl font-extrabold tracking-tight">Financely</h2>
        </div>
        <button onClick={() => onNavigate('dashboard')} className="text-secondary font-semibold text-sm hover:text-primary transition-colors">Skip</button>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <div className="w-full aspect-[4/5] bg-center bg-no-repeat bg-cover rounded-3xl bg-input-bg dark:bg-surface-dark border border-border dark:border-primary/10 mb-8" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDDEsD155JG9_oHBGboTTLSyssfFn1d322EM6h1UEwasTTqhMa0zp5cwo_RfD8igWwNIZmfZUUJUN7ugvAroXlbt7jzEGJYP54Y5tRl9-aItN5N9uR5-zzUEx_wSX2WkDY-tKyGg2qU_gNVCkBpCqPXdwkHgX7STvg0za8MN2vEhRKjfjXZMKDknkqeKSBVoq1Zp3-D2yANgz7pwUGSMoyQWmBk_lVUX4H4U-Fn-2-DMAPYNVvABtlzKXHofWfnc_57C-W1Z0oCXw")' }}>
        </div>

        <div className="space-y-4">
          <h1 className="text-text-dark dark:text-white tracking-tight text-4xl font-extrabold leading-[1.1]">
            Track your finances daily <span className="text-primary">with ease</span>
          </h1>
          <p className="text-text-secondary dark:text-slate-400 text-lg font-medium leading-relaxed max-w-[90%]">
            Take control of your spending and reach your savings goals with our premium tools.
          </p>
        </div>

        <div className="flex w-full flex-row items-center justify-start gap-2.5 py-8">
          <div className="h-1.5 w-8 rounded-full bg-primary"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-highlight dark:bg-primary/20"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-highlight dark:bg-primary/20"></div>
        </div>
      </div>

      <div className="pb-6 space-y-4 mt-auto">
        <button onClick={() => onNavigate('dashboard')} className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all text-lg">
          Get Started
        </button>
        <div className="flex items-center justify-center gap-1">
          <span className="text-text-secondary text-sm">Already have an account?</span>
          <button onClick={() => onNavigate('dashboard')} className="text-primary font-bold text-sm">Sign In</button>
        </div>
      </div>
    </div>
  );
}
