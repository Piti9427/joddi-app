import React from 'react';
import { Home, Receipt, PieChart, Plus, Landmark } from 'lucide-react';
import { ViewState } from '../App';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  // Only show bottom nav for these views
  const navVisibleViews: ViewState[] = ['dashboard', 'transactions', 'analytics', 'budget', 'settings', 'categories'];
  if (!navVisibleViews.includes(currentView) && currentView !== 'add_transaction') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border dark:border-slate-800 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl pb-8 pt-3 z-40 max-w-md mx-auto rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-all duration-500">
      <div className="flex justify-around items-center px-1 relative">
        <NavItem 
          icon={<Home size={24} />} 
          label="Home" 
          active={currentView === 'dashboard'} 
          onClick={() => onNavigate('dashboard')} 
        />
        <NavItem 
          icon={<Receipt size={24} />} 
          label="Activity" 
          active={currentView === 'transactions'} 
          onClick={() => onNavigate('transactions')} 
        />
        
        {/* Centered Add Button */}
        <div className="relative -mt-12 mb-4 px-1 group">
          <button 
            onClick={() => onNavigate('add_transaction')}
            className={`size-16 bg-primary bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-full shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-all active:scale-90 hover:scale-105 border-4 border-white dark:border-background-dark group-hover:shadow-emerald-500/50`}
          >
            <Plus size={36} strokeWidth={3} />
          </button>
        </div>

        <NavItem 
          icon={<PieChart size={24} />} 
          label="Stats" 
          active={currentView === 'analytics'} 
          onClick={() => onNavigate('analytics')} 
        />
        
        <NavItem 
          icon={<Landmark size={24} />} 
          label="Budget" 
          active={currentView === 'budget'} 
          onClick={() => onNavigate('budget')} 
        />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1.5 min-w-[64px] transition-all duration-300 relative group ${active ? 'text-primary' : 'text-secondary hover:text-text-dark dark:hover:text-slate-300'}`}
    >
      <div className={`transition-all duration-300 ${active ? 'scale-110 -translate-y-1' : 'opacity-70 group-hover:opacity-100 group-hover:-translate-y-0.5'}`}>
        {icon}
      </div>
      <p className={`text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0 scale-75 group-hover:opacity-40'}`}>
        {label}
      </p>
      {active && <span className="absolute -bottom-1 size-1 bg-primary rounded-full animate-in fade-in zoom-in duration-300"></span>}
    </button>
  );
}
