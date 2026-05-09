import React from 'react';
import { Home, Receipt, PieChart, Plus, Landmark } from 'lucide-react';
import { ViewState } from '../App';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  canCreate?: boolean;
}

export function BottomNav({ currentView, onNavigate, canCreate = true }: BottomNavProps) {
  const navVisibleViews: ViewState[] = [
    'dashboard',
    'transactions',
    'analytics',
    'budget',
    'settings',
    'categories',
    'add_transaction',
  ];
  if (!navVisibleViews.includes(currentView)) return null;

  const activeView = currentView === 'add_transaction' ? 'add_transaction' : currentView;

  return (
    <div className="shrink-0 border-t border-border/60 dark:border-slate-800 bg-white dark:bg-surface-dark safe-bottom">
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
        <div className="flex justify-center items-center">
          <button
            onClick={() => canCreate && onNavigate('add_transaction')}
            disabled={!canCreate}
            className={`w-12 h-12 rounded-2xl border-none flex items-center justify-center transition-all active:scale-90 ${
              canCreate
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-slate-300 dark:bg-slate-700 text-white cursor-default'
            }`}
          >
            <Plus size={24} strokeWidth={2.5} />
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
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 w-full h-full border-none bg-transparent cursor-pointer p-0 transition-colors ${
        active ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
      }`}
    >
      <div className={`relative flex items-center justify-center ${active ? '' : ''}`}>
        {active && (
          <div className="absolute -inset-x-3 -inset-y-1 bg-primary/8 dark:bg-primary/15 rounded-lg" />
        )}
        <span className="relative">{icon}</span>
      </div>
      <span
        className={`text-[11px] leading-none tracking-[0.02em] ${active ? 'font-extrabold' : 'font-semibold'}`}
      >
        {label}
      </span>
    </button>
  );
}
