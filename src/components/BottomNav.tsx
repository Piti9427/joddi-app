import React from 'react';
import { Home, Receipt, PieChart, Plus, Landmark } from 'lucide-react';
import { ViewState } from '../App';
import { motion, AnimatePresence } from 'motion/react';

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

  const activeView = currentView;

  return (
    <div className="fixed bottom-[calc(12px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[420px] h-[72px] bg-white/10 dark:bg-black/35 backdrop-blur-2xl rounded-[32px] border border-white/20 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex items-center justify-between px-4">
      {/* Liquid Gooey/Light filter context in background */}
      <div className="absolute inset-0 rounded-[32px] -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent dark:from-white/3 dark:to-transparent" />
      </div>

      <TabItem
        icon={<Home size={22} />}
        label="หน้าแรก"
        active={activeView === 'dashboard'}
        onClick={() => onNavigate('dashboard')}
      />
      <TabItem
        icon={<Receipt size={22} />}
        label="รายการ"
        active={activeView === 'transactions'}
        onClick={() => onNavigate('transactions')}
      />

      {/* Floating Center Action Button (FAB) with Liquid Interaction */}
      <div className="relative -top-5 flex justify-center items-center px-1 shrink-0">
        {/* Glow backdrop behind FAB */}
        <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#FF6A39] to-[#FF9472] opacity-40 blur-md animate-pulse pointer-events-none" />

        <motion.button
          onClick={() => canCreate && onNavigate('add_transaction')}
          disabled={!canCreate}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className={`relative z-10 w-[58px] h-[58px] rounded-full border border-white/25 flex items-center justify-center transition-all shadow-[0_10px_25px_rgba(255,106,57,0.45)] ${
            canCreate
              ? 'bg-gradient-to-br from-[#FF6A39] to-[#FF8C66] text-white'
              : 'bg-slate-300 dark:bg-white/10 text-white cursor-default'
          }`}
          aria-label="Add Transaction"
        >
          <motion.div
            animate={{ rotate: activeView === 'add_transaction' ? 135 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            <Plus size={30} strokeWidth={3} />
          </motion.div>
        </motion.button>
      </div>

      <TabItem
        icon={<PieChart size={22} />}
        label="วิเคราะห์"
        active={activeView === 'analytics'}
        onClick={() => onNavigate('analytics')}
      />
      <TabItem
        icon={<Landmark size={22} />}
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
      className="relative flex flex-col items-center justify-center border-none bg-transparent cursor-pointer p-0 shrink-0 h-full w-[64px]"
    >
      <AnimatePresence>
        {active && (
          <>
            {/* Liquid Background Pill indicator with Elastic Spring */}
            <motion.div
              layoutId="liquid-pill"
              className="absolute inset-x-0.5 top-2.5 bottom-2.5 bg-gradient-to-b from-[#7a36ff]/15 to-[#9b66ff]/20 dark:from-[#9b66ff]/20 dark:to-[#7a36ff]/10 border border-[#7a36ff]/30 dark:border-[#9b66ff]/30 rounded-2xl -z-10"
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 24,
                mass: 1.1,
              }}
            />
            {/* Liquid Active Dot Indicator */}
            <motion.div
              layoutId="active-dot"
              className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#7a36ff] dark:bg-[#9b66ff] shadow-[0_0_8px_#7a36ff]"
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 20,
              }}
            />
          </>
        )}
      </AnimatePresence>

      <motion.span
        animate={{
          y: active ? -2 : 0,
          scale: active ? 1.1 : 0.95,
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 20 }}
        className={`transition-colors duration-200 ${
          active ? 'text-[#7a36ff] dark:text-[#9b66ff]' : 'text-slate-400 dark:text-white/40 hover:text-white'
        }`}
      >
        {icon}
      </motion.span>
      <span
        className={`text-[8.5px] font-black uppercase mt-1 tracking-wider scale-90 origin-center transition-all duration-300 ${
          active
            ? 'text-[#7a36ff] dark:text-[#9b66ff] opacity-100 font-extrabold'
            : 'text-slate-400 dark:text-white/40 opacity-0 h-0 w-0 overflow-hidden'
        }`}
      >
        {label}
      </span>
    </button>
  );
}
