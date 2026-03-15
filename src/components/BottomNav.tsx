import React from 'react';
import { Home, Receipt, PieChart, Plus, Landmark } from 'lucide-react';
import { ViewState } from '../App';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  canCreate?: boolean;
}

const NAV_ITEMS: Array<{ view: ViewState; label: string; icon: React.ReactNode }> = [
  { view: 'dashboard', label: 'Home', icon: <Home size={22} /> },
  { view: 'transactions', label: 'Activity', icon: <Receipt size={22} /> },
  { view: 'analytics', label: 'Stats', icon: <PieChart size={22} /> },
  { view: 'budget', label: 'Budget', icon: <Landmark size={22} /> },
];

export function BottomNav({ currentView, onNavigate, canCreate = true }: BottomNavProps) {
  const navVisibleViews: ViewState[] = ['dashboard', 'transactions', 'analytics', 'budget', 'settings', 'categories', 'add_transaction'];
  if (!navVisibleViews.includes(currentView)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <div className="w-full max-w-md bg-white/98 dark:bg-surface-dark/98 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 rounded-t-[2.5rem] shadow-[0_-12px_45px_rgba(0,0,0,0.12)] pointer-events-auto flex items-end justify-around px-4 pb-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)', paddingTop: '10px' }}
      >
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

        <div className="relative -mt-8 mb-2">
          <motion.button
            whileTap={canCreate ? { scale: 0.92, rotate: -15 } : undefined}
            onClick={() => canCreate && onNavigate('add_transaction')}
            disabled={!canCreate}
            className={`size-14 rounded-full flex items-center justify-center transition-all border-[4px] border-white dark:border-surface-dark ${
              canCreate
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/30'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Plus size={30} strokeWidth={3} />
          </motion.button>
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
    </nav>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ y: -2 }}
      className={`relative flex flex-col items-center justify-center gap-1.5 h-14 min-w-[65px] transition-all duration-300 ${active ? 'text-primary' : 'text-secondary hover:text-text-dark dark:hover:text-slate-300'}`}
    >
      <motion.div
        animate={active ? { scale: 1.15 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {icon}
      </motion.div>
      <p className={`text-[9px] font-black tracking-widest uppercase transition-all duration-300 ${active ? 'opacity-100' : 'opacity-60'}`}>
        {label}
      </p>
    </motion.button>
  );
}


