import React from 'react';
import { Home, Receipt, PieChart, Settings, Plus, Landmark } from 'lucide-react';
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
    <div className="fixed bottom-0 left-0 right-0 border-t border-border dark:border-slate-800 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-md pb-8 pt-3 z-40 max-w-md mx-auto">
      <div className="flex justify-around items-center px-2 relative">
        <NavItem 
          icon={<Home size={22} />} 
          label="Home" 
          active={currentView === 'dashboard'} 
          onClick={() => onNavigate('dashboard')} 
        />
        <NavItem 
          icon={<Receipt size={22} />} 
          label="Records" 
          active={currentView === 'transactions'} 
          onClick={() => onNavigate('transactions')} 
        />
        
        {/* Centered Add Button */}
        <div className="relative -mt-10 mb-4">
          <button 
            onClick={() => onNavigate('add_transaction')}
            className={`size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition-transform active:scale-95 hover:scale-105 border-4 border-white dark:border-background-dark`}
          >
            <Plus size={32} />
          </button>
        </div>

        <NavItem 
          icon={<PieChart size={22} />} 
          label="Analytics" 
          active={currentView === 'analytics'} 
          onClick={() => onNavigate('analytics')} 
        />
        <NavItem 
          icon={<Settings size={22} />} 
          label="Menu" 
          active={currentView === 'settings' || currentView === 'categories' || currentView === 'budget'} 
          onClick={() => onNavigate('settings')} 
        />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${active ? 'text-primary' : 'text-secondary hover:text-text-dark dark:hover:text-slate-300'}`}
    >
      <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
        {icon}
      </div>
      <p className={`text-[10px] font-bold tracking-tight transition-all ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</p>
    </button>
  );
}
