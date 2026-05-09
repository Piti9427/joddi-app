import React, { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Filter, TrendingDown, TrendingUp } from 'lucide-react';
import { ViewState, Transaction } from '../App';
import { motion } from 'motion/react';
import { formatMoney } from '../lib/formatters';

type VirtualRow =
  | { type: 'dateHeader'; id: string; date: string }
  | { type: 'transaction'; id: string; transaction: Transaction };

export function TransactionHistory({
  onNavigate,
  transactions,
}: Readonly<{
  onNavigate: (v: ViewState) => void;
  transactions: Transaction[];
}>) {
  const [search, setSearch] = useState('');
  const scrollParentRef = useRef<HTMLDivElement | null>(null);

  const formatCurrency = (val: number) => formatMoney(val, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

  const virtualRows = useMemo<VirtualRow[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const rows: VirtualRow[] = [];
    let currentDate = '';

    const filtered = transactions
      .filter((transaction) => {
        if (!normalizedSearch) return true;
        return (
          transaction.merchant?.toLowerCase().includes(normalizedSearch) ||
          transaction.category.toLowerCase().includes(normalizedSearch) ||
          transaction.note.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    filtered.forEach((transaction) => {
      const dateString = new Date(transaction.date).toDateString();
      if (dateString !== currentDate) {
        currentDate = dateString;
        rows.push({ type: 'dateHeader', id: `header-${dateString}`, date: dateString });
      }
      rows.push({
        type: 'transaction',
        id: transaction.localId ?? transaction.id,
        transaction,
      });
    });

    return rows;
  }, [transactions, search]);

  const rowVirtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: (index) => (virtualRows[index]?.type === 'dateHeader' ? 44 : 88),
    overscan: 10,
    getItemKey: (index) => virtualRows[index]?.id ?? index,
  });

  const formatDateHeader = (dateString: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dateString === today) return 'วันนี้';
    if (dateString === yesterday) return 'เมื่อวาน';
    return new Date(dateString).toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative bg-slate-50 dark:bg-background-dark">
      <header
        className="flex flex-col bg-white dark:bg-surface-dark p-4 border-b border-border dark:border-slate-800 shrink-0 z-20"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 16px)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-text-dark dark:text-white">รายการทั้งหมด</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="text-primary p-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
          >
            <Filter size={20} />
          </motion.button>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white dark:focus-within:bg-slate-700 transition-all">
          <Search size={18} className="text-secondary" />
          <input
            type="text"
            placeholder="ค้นหาจากร้านค้า หมวดหมู่ หรือหมายเหตุ"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-[13px] font-bold w-full placeholder:text-secondary/60 outline-none text-text-dark dark:text-white"
          />
        </div>
      </header>

      <main ref={scrollParentRef} className="flex-1 min-h-0 overflow-y-auto ios-scroll">
        {virtualRows.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center px-10"
          >
            <div className="size-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300">
              <Search size={48} />
            </div>
            <h3 className="text-lg font-black text-text-dark dark:text-white mb-2">ไม่พบรายการที่ตรงกัน</h3>
          </motion.div>
        ) : (
          <div
            className="relative mx-4 mt-2"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const row = virtualRows[virtualItem.index];
              if (!row) return null;

              return (
                <div
                  key={virtualItem.key}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualItem.index}
                  className="absolute left-0 top-0 w-full"
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  {row.type === 'dateHeader' ? (
                    <DateHeader label={formatDateHeader(row.date)} />
                  ) : (
                    <TransactionRow transaction={row.transaction} formatCurrency={formatCurrency} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function DateHeader({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      <h3 className="text-[11px] font-extrabold text-secondary opacity-70">{label}</h3>
      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

function TransactionRow({
  transaction,
  formatCurrency,
}: Readonly<{
  transaction: Transaction;
  formatCurrency: (value: number) => string;
}>) {
  const isExpense = transaction.type === 'Expense';
  const getSyncLabel = (status: string) => {
    if (status === 'pending') return 'รอซิงก์';
    if (status === 'failed') return 'ซิงก์ไม่สำเร็จ';
    return '';
  };
  const syncLabel = getSyncLabel(transaction.syncStatus);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="mb-2 bg-white dark:bg-surface-dark p-4 rounded-[1.35rem] shadow-sm border border-border/40 dark:border-slate-800/40 flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer"
    >
      <div
        className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${isExpense ? 'bg-expense-bg/60 text-expense' : 'bg-income-bg/60 text-income'}`}
      >
        {isExpense ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="font-extrabold text-[15px] text-text-dark dark:text-white truncate">
          {transaction.merchant || transaction.category}
        </p>
        <div className="flex items-center gap-2 overflow-hidden">
          <p className="text-[10px] font-semibold text-secondary opacity-70 truncate">{transaction.category}</p>
          {syncLabel && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${transaction.syncStatus === 'failed' ? 'bg-expense-bg text-expense' : 'bg-amber-100 text-amber-700'}`}
            >
              {syncLabel}
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={`font-black text-[15px] ${isExpense ? 'text-text-dark dark:text-white' : 'text-income'}`}>
          {isExpense ? '-' : '+'}
          {formatCurrency(transaction.amount)}
        </p>
        {transaction.note && (
          <p className="text-[9px] font-bold text-secondary opacity-40 truncate max-w-[80px]">{transaction.note}</p>
        )}
      </div>
    </motion.div>
  );
}
