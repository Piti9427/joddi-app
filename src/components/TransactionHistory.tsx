import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Filter, Calendar, Check, Receipt, ChevronLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { ViewState, Transaction } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { formatMoney, getUserLocale } from '../lib/formatters';
import { getLocalCategories, LocalCategory } from '../lib/supabase';
import { getDateRangeBoundaries, parseLocalDate } from '../lib/dateUtils';
import { DateRangePicker } from './DateRangePicker';
import { ICONS, getCategoryColorStyles } from '../lib/categoryUtils';

type VirtualRow =
  | { type: 'dateHeader'; id: string; date: string }
  | { type: 'transaction'; id: string; transaction: Transaction };

type DateFilterType = 'All' | 'Today' | 'Yesterday' | 'Last7Days' | 'Last30Days' | 'ThisMonth' | 'LastMonth' | 'Custom';

interface FilterParams {
  search: string;
  filterType: 'All' | 'Income' | 'Expense';
  selectedCategories: string[];
  dateFilter: DateFilterType;
  boundaries: ReturnType<typeof getDateRangeBoundaries>;
  customStart: number;
  customEnd: number;
}

function filterTransactions(transactions: Transaction[], params: FilterParams) {
  const { search, filterType, selectedCategories, dateFilter, boundaries, customStart, customEnd } = params;
  const normalizedSearch = search.trim().toLowerCase();
  return transactions.filter((transaction) => {
    // 1. Search Filter
    if (normalizedSearch) {
      const inMerchant = transaction.merchant?.toLowerCase().includes(normalizedSearch);
      const inCategory = transaction.category.toLowerCase().includes(normalizedSearch);
      const inNote = transaction.note.toLowerCase().includes(normalizedSearch);
      if (!inMerchant && !inCategory && !inNote) return false;
    }

    // 2. Type Filter
    if (filterType !== 'All' && transaction.type !== filterType) return false;

    // 3. Category Filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(transaction.category)) return false;

    // 4. Date Filter
    if (dateFilter === 'All') return true;

    const tTime = new Date(transaction.date).getTime();
    return checkDateBoundary(tTime, dateFilter, boundaries, customStart, customEnd);
  });
}

function checkDateBoundary(
  tTime: number,
  filter: DateFilterType,
  b: ReturnType<typeof getDateRangeBoundaries>,
  start: number,
  end: number,
) {
  if (filter === 'Today') return tTime >= b.todayStart;
  if (filter === 'Yesterday') return tTime >= b.yesterdayStart && tTime <= b.yesterdayEnd;
  if (filter === 'Last7Days') return tTime >= b.last7DaysStart;
  if (filter === 'Last30Days') return tTime >= b.last30DaysStart;
  if (filter === 'ThisMonth') return tTime >= b.monthStart;
  if (filter === 'LastMonth') return tTime >= b.lastMonthStart && tTime <= b.lastMonthEnd;
  if (filter === 'Custom') {
    return (!start || tTime >= start) && (!end || tTime <= end);
  }
  return true;
}

export function TransactionHistory({
  onNavigate,
  transactions,
  categories,
  lang,
  currency,
}: Readonly<{
  onNavigate: (v: ViewState, payload?: any) => void;
  transactions: Transaction[];
  categories?: LocalCategory[];
  lang?: 'th' | 'en';
  currency?: string;
}>) {
  const currentLang = lang || 'th';
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Income' | 'Expense'>('All');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [localCategories, setLocalCategories] = useState<LocalCategory[]>(categories || []);
  const scrollParentRef = useRef<HTMLDivElement | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setLocalCategories(categories);
    } else {
      getLocalCategories().then(setLocalCategories);
    }
  }, [categories]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterType !== 'All') count++;
    if (selectedCategories.length > 0) count++;
    if (dateFilter !== 'All') count++;
    return count;
  }, [filterType, selectedCategories, dateFilter]);

  const formatCurrency = (val: number) =>
    formatMoney(val, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      currency,
      locale: getUserLocale(),
    });

  const calendarDays = useMemo(() => {
    const days = [];
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const fullDate = `${year}-${month}-${date}`;
      days.push({
        dateStr: d.toDateString(),
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'th-TH', { weekday: 'short' }),
        fullDate,
      });
    }
    return days;
  }, [currentLang]);

  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;

    const boundaries = getDateRangeBoundaries();
    const customStart = dateFilter === 'Custom' && customStartDate ? parseLocalDate(customStartDate).getTime() : 0;
    const customEnd =
      dateFilter === 'Custom' && customEndDate ? parseLocalDate(customEndDate).setHours(23, 59, 59, 999) : 0;

    const filtered = filterTransactions(transactions, {
      search,
      filterType,
      selectedCategories,
      dateFilter,
      boundaries,
      customStart,
      customEnd,
    });

    const calendarFiltered = selectedDate
      ? filtered.filter((t) => {
          const d = new Date(t.date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const date = String(d.getDate()).padStart(2, '0');
          const fullDate = `${year}-${month}-${date}`;
          return fullDate === selectedDate;
        })
      : filtered;

    calendarFiltered.forEach((t) => {
      if (t.type === 'Income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    return { income, expense, list: calendarFiltered };
  }, [transactions, search, filterType, selectedCategories, dateFilter, customStartDate, customEndDate, selectedDate]);

  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    let totalExpense = 0;

    filteredTotals.list.forEach((t) => {
      if (t.type === 'Expense') {
        map[t.category] = (map[t.category] || 0) + t.amount;
        totalExpense += t.amount;
      }
    });

    return Object.entries(map)
      .map(([name, amount]) => {
        const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        const categoryObj = localCategories.find((c) => c.name === name);
        const icon = categoryObj?.iconName ?? 'Food';
        const color = categoryObj?.color ?? '#FF6A39';
        return {
          name,
          amount,
          percent: pct,
          icon,
          color,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTotals.list, localCategories]);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [calendarDays, filteredTotals, categorySummary]);

  const virtualRows = useMemo<VirtualRow[]>(() => {
    const rows: VirtualRow[] = [];
    let currentDate = '';

    const list = [...filteredTotals.list];
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    list.forEach((transaction) => {
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
  }, [filteredTotals]);

  const rowVirtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: (index) => (virtualRows[index]?.type === 'dateHeader' ? 44 : 88),
    overscan: 10,
    scrollMargin: headerHeight,
    getItemKey: (index) => {
      const row = virtualRows[index];
      if (!row) return index;
      if (row.type === 'dateHeader') return row.id;
      return row.transaction.id || row.transaction.localId || index;
    },
  });

  const formatDateHeader = (dateString: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dateString === today) return currentLang === 'en' ? 'Today' : 'วันนี้';
    if (dateString === yesterday) return currentLang === 'en' ? 'Yesterday' : 'เมื่อวาน';
    return new Date(dateString).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'th-TH', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) => (prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]));
  };

  const clearAllFilters = () => {
    setFilterType('All');
    setSelectedCategories([]);
    setDateFilter('All');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearch('');
  };

  const labels = useMemo(
    () => ({
      type:
        currentLang === 'en'
          ? { All: 'All', Income: 'Income', Expense: 'Expense' }
          : { All: 'ทั้งหมด', Income: 'รายรับ', Expense: 'รายจ่าย' },
      date:
        currentLang === 'en'
          ? {
              All: 'All',
              Today: 'Today',
              Yesterday: 'Yesterday',
              Last7Days: 'Last 7 Days',
              Last30Days: 'Last 30 Days',
              ThisMonth: 'This Month',
              LastMonth: 'Last Month',
              Custom: 'Custom',
            }
          : {
              All: 'ทั้งหมด',
              Today: 'วันนี้',
              Yesterday: 'เมื่อวาน',
              Last7Days: '7 วันที่ผ่านมา',
              Last30Days: '30 วันที่ผ่านมา',
              ThisMonth: 'เดือนนี้',
              LastMonth: 'เดือนที่แล้ว',
              Custom: 'กำหนดเอง',
            },
    }),
    [currentLang],
  );

  return (
    <div className="flex flex-col h-full min-h-0 relative bg-background-light dark:bg-background-dark">
      <header
        className="flex flex-col bg-white dark:bg-surface-dark p-4 border-b border-border dark:border-white/5 shrink-0 z-20"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 16px)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => onNavigate('dashboard')}
            className="size-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-xl text-secondary hover:text-text-dark transition-colors border border-transparent dark:border-white/5"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-black text-text-dark dark:text-white flex-1">
            {currentLang === 'en' ? 'Transactions' : 'รายการทั้งหมด'}
          </h1>
          <div className="flex items-center gap-2">
            {(activeFilterCount > 0 || search) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={clearAllFilters}
                className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-full"
              >
                {currentLang === 'en' ? 'Clear' : 'ล้างตัวกรอง'}
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-all duration-300 relative ${
                showFilters
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-primary bg-primary/10 hover:bg-primary/20'
              }`}
            >
              <Filter size={20} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 size-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-surface-dark">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white dark:focus-within:bg-white/10 transition-all border border-transparent dark:border-white/5">
          <Search size={18} className="text-secondary" />
          <input
            type="text"
            placeholder={
              currentLang === 'en' ? 'Search merchant, category, or note' : 'ค้นหาจากร้านค้า หมวดหมู่ หรือหมายเหตุ'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-[13px] font-bold w-full placeholder:text-secondary/60 outline-none text-text-dark dark:text-white"
          />
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
                {(['All', 'Income', 'Expense'] as const).map((type) => (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all ${
                      filterType === type
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-slate-100 dark:bg-white/5 text-secondary hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {labels.type[type as keyof typeof labels.type]}
                  </motion.button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">
                  {currentLang === 'en' ? 'Date Range' : 'ช่วงเวลา'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      'All',
                      'Today',
                      'Yesterday',
                      'Last7Days',
                      'Last30Days',
                      'ThisMonth',
                      'LastMonth',
                      'Custom',
                    ] as const
                  ).map((type) => (
                    <motion.button
                      key={type}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setDateFilter(type);
                        if (type === 'Custom') setShowDatePicker(true);
                      }}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                        dateFilter === type
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-slate-100 dark:bg-white/5 text-secondary hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      <Calendar size={12} />
                      {labels.date[type]}
                    </motion.button>
                  ))}
                </div>

                {dateFilter === 'Custom' && (customStartDate || customEndDate) && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-slate-100 dark:bg-white/5 p-2.5 rounded-xl text-[11px] font-bold text-slate-500 dark:text-white/60">
                      {customStartDate || '-'}
                    </div>
                    <div className="text-slate-300">→</div>
                    <div className="flex-1 bg-slate-100 dark:bg-white/5 p-2.5 rounded-xl text-[11px] font-bold text-slate-500 dark:text-white/60">
                      {customEndDate || '-'}
                    </div>
                    <button
                      onClick={() => setShowDatePicker(true)}
                      className="p-2.5 bg-primary/10 text-primary rounded-xl font-bold text-[11px]"
                    >
                      {currentLang === 'en' ? 'Edit' : 'แก้ไข'}
                    </button>
                  </div>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-black text-secondary uppercase tracking-wider pl-1">
                  {currentLang === 'en' ? 'Categories' : 'หมวดหมู่'}
                </p>
                <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                  {localCategories
                    .filter((c) => filterType === 'All' || c.type === filterType)
                    .map((cat) => (
                      <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleCategory(cat.name)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-black whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                          selectedCategories.includes(cat.name)
                            ? 'bg-primary text-white shadow-md shadow-primary/20 border-primary'
                            : 'bg-slate-100 dark:bg-white/5 text-secondary border-transparent dark:border-white/5'
                        }`}
                      >
                        {selectedCategories.includes(cat.name) && <Check size={12} />}
                        {cat.name}
                      </motion.button>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main ref={scrollParentRef} className="flex-1 min-h-0 overflow-y-auto ios-scroll">
        <div ref={headerRef} className="flex flex-col gap-4 px-4 py-2 shrink-0">
          {/* Horizontal Calendar */}
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-2 shrink-0">
            {calendarDays.map((day) => {
              const isActive = selectedDate === day.fullDate;
              return (
                <motion.button
                  key={day.fullDate}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(isActive ? null : day.fullDate)}
                  className={`flex flex-col items-center justify-center w-12 h-16 shrink-0 rounded-2xl transition-all border ${
                    isActive
                      ? 'bg-[#FF6A39] text-white border-[#FF6A39] shadow-[0_4px_15px_rgba(255,106,57,0.3)]'
                      : 'bg-white dark:bg-white/2 border-border/40 dark:border-white/5 text-text-dark dark:text-slate-300 shadow-[0_4px_15px_rgba(0,0,0,0.03)]'
                  }`}
                >
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white/70' : 'text-secondary/60'}`}
                  >
                    {day.dayName}
                  </span>
                  <span className="text-base font-black tracking-tight mt-0.5">{day.dayNum}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Income Card (Purple) */}
            <div className="bg-[#7A36FF] text-white p-4 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-[#7A36FF]/10 relative overflow-hidden flex flex-col justify-between min-h-[96px]">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <TrendingUp size={80} />
              </div>
              <div className="relative z-10">
                <p className="text-white/75 text-[9px] font-black uppercase tracking-[0.2em] mb-1">
                  {currentLang === 'en' ? 'Income' : 'รายรับ'}
                </p>
                <h4 className="text-lg font-black tracking-tight leading-tight tabular-nums">
                  {formatCurrency(filteredTotals.income)}
                </h4>
              </div>
            </div>

            {/* Expense Card (Orange) */}
            <div className="bg-[#FF6A39] text-white p-4 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-[#FF6A39]/10 relative overflow-hidden flex flex-col justify-between min-h-[96px]">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <TrendingDown size={80} />
              </div>
              <div className="relative z-10">
                <p className="text-white/75 text-[9px] font-black uppercase tracking-[0.2em] mb-1">
                  {currentLang === 'en' ? 'Expense' : 'รายจ่าย'}
                </p>
                <h4 className="text-lg font-black tracking-tight leading-tight tabular-nums">
                  {formatCurrency(filteredTotals.expense)}
                </h4>
              </div>
            </div>
          </div>

          {/* Budget Progress (Spend by Category) */}
          {categorySummary.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] pl-1">
                {currentLang === 'en' ? 'Budget & Spend by Category' : 'การใช้จ่ายตามหมวดหมู่'}
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {categorySummary.map((item) => {
                  const iconNode = ICONS[item.icon] || <Receipt size={18} />;
                  const categoryColor = item.color;
                  return (
                    <div
                      key={item.name}
                      className="bg-white dark:bg-white/2 p-3.5 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-border/40 dark:border-white/5 flex items-center gap-3.5 hover:shadow-md transition-all"
                    >
                      <div
                        className="size-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
                      >
                        {React.cloneElement(iconNode as React.ReactElement, { size: 18, strokeWidth: 2 })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-black text-text-dark dark:text-white truncate">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-black text-text-dark dark:text-white tabular-nums">
                              {formatCurrency(item.amount)}
                            </span>
                            <span className="text-[9px] font-bold text-secondary">{item.percent.toFixed(0)}%</span>
                          </div>
                        </div>
                        {/* Custom CSS Progress Bar */}
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.percent}%`,
                              backgroundColor: categoryColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {virtualRows.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center px-10"
          >
            <div className="size-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-white/30 border border-transparent dark:border-white/5">
              <Search size={48} />
            </div>
            <h3 className="text-lg font-black text-text-dark dark:text-white mb-2">
              {currentLang === 'en' ? 'No matching transactions' : 'ไม่พบรายการที่ตรงกัน'}
            </h3>
            <p className="text-xs font-bold text-secondary opacity-60">
              {currentLang === 'en' ? 'Try adjusting your filters' : 'ลองปรับตัวกรองของคุณ'}
            </p>
          </motion.div>
        ) : (
          <div
            className="relative mx-4"
            style={{
              height: `${rowVirtualizer.getTotalSize() - headerHeight}px`,
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
                  style={{ transform: `translateY(${virtualItem.start - headerHeight}px)` }}
                >
                  {row.type === 'dateHeader' ? (
                    <DateHeader label={formatDateHeader(row.date)} />
                  ) : (
                    <TransactionRow
                      transaction={row.transaction}
                      categories={localCategories}
                      formatCurrency={formatCurrency}
                      onClick={(id) => onNavigate('transaction_detail', id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <DateRangePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialStart={customStartDate}
        initialEnd={customEndDate}
        onSelect={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
        }}
      />
    </div>
  );
}

function DateHeader({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex items-center gap-3 px-2 py-3">
      <div className="h-px flex-1 bg-slate-200 dark:bg-white/5" />
      <h3 className="text-[11px] font-extrabold text-secondary opacity-70">{label}</h3>
      <div className="h-px flex-1 bg-slate-200 dark:bg-white/5" />
    </div>
  );
}

function TransactionRow({
  transaction,
  categories = [],
  formatCurrency,
  onClick,
}: Readonly<{
  transaction: Transaction;
  categories?: LocalCategory[];
  formatCurrency: (value: number) => string;
  onClick?: (id: string) => void;
}>) {
  const isExpense = transaction.type === 'Expense';
  const categoryObj = categories.find((c) => c.name === transaction.category);
  const iconNode = (categoryObj && ICONS[categoryObj.iconName]) || <Receipt size={22} />;
  const colorStyles = categoryObj
    ? getCategoryColorStyles(categoryObj.color)
    : { style: {}, className: isExpense ? 'text-expense' : 'text-income' };

  const getSyncLabel = (status: string) => {
    if (status === 'pending') return 'รอซิงก์';
    if (status === 'failed') return 'ซิงก์ไม่สำเร็จ';
    return '';
  };
  const syncLabel = getSyncLabel(transaction.syncStatus);

  const fallbackClass = isExpense ? 'bg-expense-bg text-expense' : 'bg-income-bg text-income';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(transaction.id)}
      className="mb-2 bg-white dark:bg-white/2 p-4 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-border/40 dark:border-white/5 flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer"
    >
      <div
        className={`size-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-inner ${
          categoryObj ? '' : fallbackClass
        }`}
        style={colorStyles.style}
      >
        <span className={colorStyles.className}>
          {React.cloneElement(iconNode as React.ReactElement, { size: 22, strokeWidth: 2 })}
        </span>
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
        <p className={`font-black text-[16px] tabular-nums ${isExpense ? 'text-expense' : 'text-income'}`}>
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
