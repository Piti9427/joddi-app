import React from 'react';
import { User, Bell, Wallet, TrendingUp, TrendingDown, PiggyBank, ShoppingBasket, Coffee, Banknote, Tv, Plus, Home, Receipt, PieChart, Landmark, Settings } from 'lucide-react';
import { ViewState } from '../App';

export function Dashboard({ onNavigate }: { onNavigate: (v: ViewState) => void }) {
  return (
    <div className="flex flex-col min-h-full pb-20 relative">
      {/* Header */}
      <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="text-primary" size={20} />
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center">My Finances</h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="flex flex-col gap-1 rounded-xl p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Today's Income</p>
          <p className="text-primary tracking-tight text-xl font-bold leading-tight">$0.00</p>
        </div>
        <div className="flex flex-col gap-1 rounded-xl p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Today's Expenses</p>
          <p className="text-rose-500 tracking-tight text-xl font-bold leading-tight">$45.20</p>
        </div>
        <div className="col-span-2 flex flex-col gap-1 rounded-xl p-5 bg-primary text-white shadow-lg shadow-primary/20">
          <p className="text-primary-50 dark:text-white/80 text-sm font-medium opacity-90">Current Balance</p>
          <div className="flex items-center justify-between">
            <p className="tracking-tight text-3xl font-bold leading-tight">$2,450.80</p>
            <Wallet size={32} className="opacity-50" />
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">This Month Summary</h3>
          <button className="text-primary text-sm font-semibold">View Reports</button>
        </div>
        <div className="flex overflow-x-auto pb-4 px-4 gap-3 no-scrollbar">
          <div className="flex shrink-0 w-40 flex-col gap-3 rounded-xl p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-emerald-800 dark:text-emerald-200 text-sm font-semibold">Income</p>
              <p className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">$5,200.00</p>
            </div>
          </div>
          <div className="flex shrink-0 w-40 flex-col gap-3 rounded-xl p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="text-rose-600" size={20} />
            </div>
            <div>
              <p className="text-rose-800 dark:text-rose-200 text-sm font-semibold">Expenses</p>
              <p className="text-rose-600 dark:text-rose-400 text-lg font-bold">$3,100.00</p>
            </div>
          </div>
          <div className="flex shrink-0 w-40 flex-col gap-3 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <PiggyBank className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-blue-800 dark:text-blue-200 text-sm font-semibold">Savings</p>
              <p className="text-blue-600 dark:text-blue-400 text-lg font-bold">$2,100.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="flex flex-col px-4 pb-6">
        <div className="flex items-center justify-between py-4">
          <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Recent Transactions</h3>
          <button className="text-slate-500 text-sm font-medium">See All</button>
        </div>
        <div className="space-y-4">
          <TransactionItem icon={<ShoppingBasket className="text-orange-600" size={24} />} bg="bg-orange-100 dark:bg-orange-900/30" title="Grocery Store" subtitle="Food & Drinks • 10:30 AM" amount="-$32.50" amountColor="text-rose-500" />
          <TransactionItem icon={<Coffee className="text-amber-800" size={24} />} bg="bg-amber-100 dark:bg-amber-900/30" title="Starbucks Coffee" subtitle="Lifestyle • 08:15 AM" amount="-$12.70" amountColor="text-rose-500" onClick={() => onNavigate('review_receipt')} />
          <TransactionItem icon={<Banknote className="text-primary" size={24} />} bg="bg-primary/10 dark:bg-primary/20" title="Monthly Salary" subtitle="Income • Yesterday" amount="+$4,200.00" amountColor="text-primary" />
          <TransactionItem icon={<Tv className="text-indigo-600" size={24} />} bg="bg-indigo-100 dark:bg-indigo-900/30" title="Netflix Subscription" subtitle="Entertainment • 2 days ago" amount="-$15.99" amountColor="text-rose-500" />
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => onNavigate('add_transaction')} className="absolute bottom-24 right-6 size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center z-20 hover:scale-105 active:scale-95 transition-transform">
        <Plus size={32} />
      </button>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm px-4 pb-6 pt-2 z-10">
        <div className="flex justify-between items-center">
          <NavItem icon={<Home size={24} className="fill-current" />} label="Home" active />
          <NavItem icon={<Receipt size={24} />} label="Transactions" />
          <NavItem icon={<PieChart size={24} />} label="Analytics" />
          <NavItem icon={<Landmark size={24} />} label="Budget" />
          <NavItem icon={<Settings size={24} />} label="Settings" />
        </div>
      </div>
    </div>
  );
}

function TransactionItem({ icon, bg, title, subtitle, amount, amountColor, onClick }: any) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer" onClick={onClick}>
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 border-b border-slate-50 dark:border-slate-800 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-900 dark:text-slate-100 font-bold">{title}</p>
            <p className="text-slate-500 text-xs">{subtitle}</p>
          </div>
          <p className={`${amountColor} font-bold`}>{amount}</p>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }: any) {
  return (
    <button className={`flex flex-1 flex-col items-center gap-1 ${active ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
      {icon}
      <p className="text-[10px] font-bold">{label}</p>
    </button>
  );
}
