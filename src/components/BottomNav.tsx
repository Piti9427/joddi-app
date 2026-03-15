import React from 'react';
import { Home, Receipt, PieChart, Plus, Landmark } from 'lucide-react';
import { ViewState } from '../App';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  canCreate?: boolean;
}

const NAV_ITEMS: Array<{ view: ViewState; label: string; icon: React.ReactNode }> = [
  { view: 'dashboard', label: 'Home', icon: <Home size={20} /> },
  { view: 'transactions', label: 'Activity', icon: <Receipt size={20} /> },
  { view: 'analytics', label: 'Stats', icon: <PieChart size={20} /> },
  { view: 'budget', label: 'Budget', icon: <Landmark size={20} /> },
];

export function BottomNav({ currentView, onNavigate, canCreate = true }: BottomNavProps) {
  const navVisibleViews: ViewState[] = ['dashboard', 'transactions', 'analytics', 'budget', 'settings', 'categories', 'add_transaction'];
  if (!navVisibleViews.includes(currentView)) return null;

  return (
    <div className="shrink-0 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-5 h-16">
        <NavItem
          icon={NAV_ITEMS[0].icon}
          label={NAV_ITEMS[0].label}
          active={currentView === NAV_ITEMS[0].view}
          onClick={() => onNavigate(NAV_ITEMS[0].view)}
        />
        <NavItem
          icon={NAV_ITEMS[1].icon}
          label={NAV_ITEMS[1].label}
          active={currentView === NAV_ITEMS[1].view}
          onClick={() => onNavigate(NAV_ITEMS[1].view)}
        />

        {/* Center FAB */}
        <div className="flex items-start justify-center">
          <button
            onClick={() => canCreate && onNavigate('add_transaction')}
            disabled={!canCreate}
            className={`size-12 -mt-4 rounded-full flex items-center justify-center border-4 border-white dark:border-background-dark ${
              canCreate
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 active:scale-90'
                : 'bg-slate-300 text-slate-500'
            } transition-transform`}
          >
            <Plus size={24} strokeWidth={2.8} />
          </button>
        </div>

        <NavItem
          icon={NAV_ITEMS[2].icon}
          label={NAV_ITEMS[2].label}
          active={currentView === NAV_ITEMS[2].view}
          onClick={() => onNavigate(NAV_ITEMS[2].view)}
        />
        <NavItem
          icon={NAV_ITEMS[3].icon}
          label={NAV_ITEMS[3].label}
          active={currentView === NAV_ITEMS[3].view}
          onClick={() => onNavigate(NAV_ITEMS[3].view)}
        />
      </div>
      {/* Safe area spacer for iPhone home indicator */}
      <div className="safe-bottom" />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-colors ${
        active ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'
      }`}
    >
      {icon}
      <span
        className="text-[10px] font-bold uppercase tracking-wide leading-none"
        style={{ opacity: active ? 1 : 0.7 }}
      >
        {label}
      </span>
    </button>
  );
}
