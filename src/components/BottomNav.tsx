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
  { view: 'dashboard', label: 'Home', icon: <Home size={21} /> },
  { view: 'transactions', label: 'Activity', icon: <Receipt size={21} /> },
  { view: 'analytics', label: 'Stats', icon: <PieChart size={21} /> },
  { view: 'budget', label: 'Budget', icon: <Landmark size={21} /> },
];

export function BottomNav({ currentView, onNavigate, canCreate = true }: BottomNavProps) {
  const navVisibleViews: ViewState[] = ['dashboard', 'transactions', 'analytics', 'budget', 'settings', 'categories', 'add_transaction'];
  if (!navVisibleViews.includes(currentView)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border/80 dark:border-slate-800 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl pb-safe-nav pt-2 z-40 max-w-md mx-auto rounded-t-[2rem] shadow-[0_-10px_35px_rgba(15,23,42,0.08)] transition-all duration-300">
      <div className="flex items-end justify-between px-2 gap-1">
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

        <div className="relative -mt-8 mb-1 px-1">
          <motion.button
            aria-label="Add transaction"
            whileTap={canCreate ? { scale: 0.92, rotate: -15 } : undefined}
            onClick={() => canCreate && onNavigate('add_transaction')}
            disabled={!canCreate}
            className={`size-14 rounded-full flex items-center justify-center transition-all border-[3px] border-white dark:border-background-dark ${
              canCreate
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/30'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Plus size={28} strokeWidth={2.8} />
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
      aria-label={label}
      onClick={onClick}
      whileTap={{ y: -2 }}
      className={`relative flex flex-col items-center justify-center gap-1 h-14 min-w-[62px] rounded-2xl transition-all duration-300 ${active ? 'text-primary' : 'text-secondary hover:text-text-dark dark:hover:text-slate-300'}`}
    >
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-2xl bg-primary/10"
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        />
      )}
      <motion.div
        className="relative z-10"
        animate={active ? { y: -1, scale: 1.12 } : { y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {icon}
      </motion.div>
      <p className={`relative z-10 text-[10px] font-black tracking-wide uppercase transition-all duration-300 ${active ? 'opacity-100' : 'opacity-70'}`}>
        {label}
      </p>
    </motion.button>
  );
}
