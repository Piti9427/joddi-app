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
    <div className="fixed bottom-[calc(12px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[420px] h-[66px] bg-[#0F0F15]/90 dark:bg-black/90 backdrop-blur-xl rounded-[28px] border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-between px-3.5">
      <TabItem
        icon={<Home size={20} strokeWidth={activeView === 'dashboard' ? 2.2 : 1.6} />}
        label="หน้าแรก"
        active={activeView === 'dashboard'}
        onClick={() => onNavigate('dashboard')}
      />
      <TabItem
        icon={<Receipt size={20} strokeWidth={activeView === 'transactions' ? 2.2 : 1.6} />}
        label="รายการ"
        active={activeView === 'transactions'}
        onClick={() => onNavigate('transactions')}
      />

      {/* Center FAB Button */}
      <div className="relative -top-4 flex justify-center items-center px-1 shrink-0">
        <button
          onClick={() => canCreate && onNavigate('add_transaction')}
          disabled={!canCreate}
          className={`w-14 h-14 rounded-full border-none flex items-center justify-center transition-all active:scale-95 shadow-[0_8px_20px_rgba(255,106,57,0.4)] ${
            canCreate
              ? 'bg-[#FF6A39] text-white hover:bg-[#ff7b4d]'
              : 'bg-slate-300 dark:bg-white/10 text-white cursor-default'
          }`}
          aria-label="Add Transaction"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>

      <TabItem
        icon={<PieChart size={20} strokeWidth={activeView === 'analytics' ? 2.2 : 1.6} />}
        label="วิเคราะห์"
        active={activeView === 'analytics'}
        onClick={() => onNavigate('analytics')}
      />
      <TabItem
        icon={<Landmark size={20} strokeWidth={activeView === 'budget' ? 2.2 : 1.6} />}
        label="งบประมาณ"
        active={activeView === 'budget'}
        onClick={() => onNavigate('budget')}
      />
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
      className={`flex items-center justify-center transition-all duration-300 border-none bg-transparent cursor-pointer p-0 shrink-0 ${
        active
          ? 'bg-white/10 text-[#7a36ff] dark:text-[#9b66ff] rounded-full px-3 py-2 gap-1.5'
          : 'text-slate-400 dark:text-white/40 hover:text-white px-2.5 py-2'
      }`}
    >
      <span>{icon}</span>
      {active && <span className="text-[10px] font-black tracking-wide whitespace-nowrap">{label}</span>}
    </button>
  );
}
