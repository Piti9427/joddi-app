import React from 'react';
import { Home, Receipt, PieChart, Plus, Landmark } from 'lucide-react';
import { ViewState } from '../App';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  canCreate?: boolean;
}

export function BottomNav({
  currentView,
  onNavigate,
  canCreate = true,
}: Readonly<{
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  canCreate?: boolean;
}>) {
  const navVisibleViews: ViewState[] = [
    'dashboard',
    'transactions',
    'analytics',
    'budget',
    'settings',
    'categories',
    'add_transaction',
    'transaction_detail',
  ];
  if (!navVisibleViews.includes(currentView)) return null;

  const activeView = currentView === 'add_transaction' ? 'add_transaction' : currentView;

  return (
    <div className="shrink-0 border-t border-border/40 dark:border-white/5 bg-white/80 dark:bg-black/80 backdrop-blur-lg safe-bottom">
      <div className="grid grid-cols-5 h-[60px] items-center">
        <TabItem
          icon={<Home size={22} strokeWidth={activeView === 'dashboard' ? 2.2 : 1.6} />}
          label="หน้าแรก"
          active={activeView === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <TabItem
          icon={<Receipt size={22} strokeWidth={activeView === 'transactions' ? 2.2 : 1.6} />}
          label="รายการ"
          active={activeView === 'transactions'}
          onClick={() => onNavigate('transactions')}
        />

        {/* Center FAB */}
        <div className="flex justify-center items-center relative h-full">
          <button
            onClick={() => canCreate && onNavigate('add_transaction')}
            disabled={!canCreate}
            className={`w-14 h-14 rounded-full border-none flex items-center justify-center transition-all active:scale-90 absolute -top-5 z-30 ${
              canCreate
                ? 'bg-[#FF6A39] text-white shadow-lg shadow-[#FF6A39]/30'
                : 'bg-slate-300 dark:bg-white/10 text-white cursor-default'
            }`}
            aria-label="Add Transaction"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        <TabItem
          icon={<PieChart size={22} strokeWidth={activeView === 'analytics' ? 2.2 : 1.6} />}
          label="วิเคราะห์"
          active={activeView === 'analytics'}
          onClick={() => onNavigate('analytics')}
        />
        <TabItem
          icon={<Landmark size={22} strokeWidth={activeView === 'budget' ? 2.2 : 1.6} />}
          label="งบ"
          active={activeView === 'budget'}
          onClick={() => onNavigate('budget')}
        />
      </div>
    </div>
  );
}

function TabItem({
  icon,
  label,
  active,
  onClick,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 w-full h-full border-none bg-transparent cursor-pointer p-0 transition-colors ${
        active ? 'text-primary' : 'text-slate-400 dark:text-white/30'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {active && <div className="absolute -inset-x-3 -inset-y-1 bg-primary/8 dark:bg-primary/10 rounded-lg" />}
        <span className="relative">{icon}</span>
      </div>
      <span className={`text-[10px] leading-none tracking-[0.05em] ${active ? 'font-black' : 'font-bold'}`}>
        {label}
      </span>
    </button>
  );
}
