import React, { useState } from 'react';
import { User, Bell, Shield, Moon, Globe, LogOut, ChevronRight, HelpCircle, LogIn } from 'lucide-react';
import { ViewState } from '../App';

export function Settings({
  onNavigate,
  isAuthenticated = true,
  onSignOut,
  onRequestSignIn,
  userEmail,
}: {
  onNavigate: (v: ViewState) => void;
  isAuthenticated?: boolean;
  onSignOut?: () => void | Promise<void>;
  onRequestSignIn?: () => void;
  userEmail?: string;
}) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const supportSettings = [{ icon: <HelpCircle />, label: 'Help Center' }];

  return (
    <div className="flex flex-col min-h-full pb-20 relative bg-background-light dark:bg-background-dark">
      <header className="safe-top flex items-center bg-surface dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 sticky top-0 z-10">
        <div className="size-10 shrink-0"></div>
        <h1 className="text-lg font-bold leading-tight flex-1 text-center text-text-dark dark:text-white">Settings</h1>
        <div className="size-10 shrink-0"></div>
      </header>

      <main className="p-4 flex flex-col flex-1 space-y-6">
        <div className="bg-surface dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-border dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:bg-input-bg dark:hover:bg-slate-800/50 transition-colors">
          <div className="size-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary/20">
            {isAuthenticated && userEmail ? userEmail[0].toUpperCase() : 'G'}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-text-dark dark:text-white leading-tight">
              {isAuthenticated && userEmail ? userEmail.split('@')[0] : 'Guest Account'}
            </h2>
            <p className="text-secondary text-sm font-bold opacity-80">
              {isAuthenticated && userEmail ? userEmail : 'Sign in to sync your data'}
            </p>
          </div>
          <ChevronRight className="text-secondary opacity-40" />
        </div>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary pl-2">Preferences</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-2 shadow-sm border border-border dark:border-slate-800 space-y-1">
            <SettingRow icon={<Moon />} label="Dark Mode">
              <button
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${darkMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`size-5 bg-white rounded-full shadow-sm absolute transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </SettingRow>

            <SettingRow icon={<Globe />} label="Currency" value="Auto" />
            <SettingRow icon={<Bell />} label="Notifications" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary pl-2">Account</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-3xl p-2 shadow-sm border border-border dark:border-slate-800 space-y-1">
            <SettingRow icon={<User />} label="Personal Information" />
            <SettingRow icon={<Shield />} label="Security & Privacy" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-secondary pl-2">Support</h3>
          <div className="bg-surface dark:bg-surface-dark rounded-[2rem] p-2 shadow-sm border border-border dark:border-slate-800">
            {supportSettings.map((item, index) => (
              <SettingRow key={index} icon={item.icon} label={item.label} />
            ))}

            {isAuthenticated ? (
              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-4 p-4 hover:bg-input-bg dark:hover:bg-slate-800/50 rounded-2xl transition-colors text-left text-rose-500 group"
              >
                <div className="size-10 rounded-[1.2rem] bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  <LogOut size={20} />
                </div>
                <div className="flex-1 font-bold">Sign Out</div>
              </button>
            ) : (
              <button
                onClick={onRequestSignIn}
                className="w-full flex items-center gap-4 p-4 hover:bg-input-bg dark:hover:bg-slate-800/50 rounded-2xl transition-colors text-left text-primary group"
              >
                <div className="size-10 rounded-[1.2rem] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <LogIn size={20} />
                </div>
                <div className="flex-1 font-bold">Sign In to Unlock Writing</div>
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function SettingRow({ icon, label, value, children }: any) {
  return (
    <div className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-input-bg dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
      <div className="size-10 rounded-xl bg-input-bg dark:bg-slate-800 flex items-center justify-center text-secondary shrink-0">
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div className="flex-1">
        <p className="text-text-dark dark:text-slate-100 font-bold text-[15px]">{label}</p>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-bold text-secondary">{value}</span>}
        {children ? children : <ChevronRight className="text-secondary" size={20} />}
      </div>
    </div>
  );
}
