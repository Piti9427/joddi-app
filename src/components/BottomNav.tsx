import React from 'react';
import { Home, Receipt, PieChart, Plus, Landmark } from 'lucide-react';
import { ViewState } from '../App';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  canCreate?: boolean;
}

export function BottomNav({ currentView, onNavigate, canCreate = true }: BottomNavProps) {
  const navVisibleViews: ViewState[] = ['dashboard', 'transactions', 'analytics', 'budget', 'settings', 'categories', 'add_transaction'];
  if (!navVisibleViews.includes(currentView)) return null;

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          height: 60,
          alignItems: 'center',
        }}
      >
        <TabItem
          icon={<Home size={22} strokeWidth={currentView === 'dashboard' ? 2.2 : 1.6} />}
          label="Home"
          active={currentView === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <TabItem
          icon={<Receipt size={22} strokeWidth={currentView === 'transactions' ? 2.2 : 1.6} />}
          label="Activity"
          active={currentView === 'transactions'}
          onClick={() => onNavigate('transactions')}
        />

        {/* Center FAB — same grid cell width as others */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => canCreate && onNavigate('add_transaction')}
            disabled={!canCreate}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              border: 'none',
              backgroundColor: canCreate ? '#10b981' : '#d1d5db',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: canCreate ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
              cursor: canCreate ? 'pointer' : 'default',
            }}
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>

        <TabItem
          icon={<PieChart size={22} strokeWidth={currentView === 'analytics' ? 2.2 : 1.6} />}
          label="Stats"
          active={currentView === 'analytics'}
          onClick={() => onNavigate('analytics')}
        />
        <TabItem
          icon={<Landmark size={22} strokeWidth={currentView === 'budget' ? 2.2 : 1.6} />}
          label="Budget"
          active={currentView === 'budget'}
          onClick={() => onNavigate('budget')}
        />
      </div>
    </div>
  );
}

function TabItem({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        width: '100%',
        height: '100%',
        border: 'none',
        backgroundColor: 'transparent',
        color: active ? '#10b981' : '#9ca3af',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {icon}
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.02em',
      }}>
        {label}
      </span>
    </button>
  );
}
