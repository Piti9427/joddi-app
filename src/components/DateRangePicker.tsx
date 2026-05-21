import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { getUserLocale } from '../lib/formatters';

interface DateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (start: string, end: string) => void;
  initialStart?: string;
  initialEnd?: string;
}

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];
const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function DateRangePicker({
  isOpen,
  onClose,
  onSelect,
  initialStart,
  initialEnd,
}: Readonly<DateRangePickerProps>) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(initialStart ? new Date(initialStart) : null);
  const [endDate, setEndDate] = useState<Date | null>(initialEnd ? new Date(initialEnd) : null);
  const currentLang = getUserLocale() === 'th-TH' ? 'th' : 'en';

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return generateCalendarDays(year, month);
  }, [currentDate]);

  const handleDateClick = (day: number, month: number, year: number) => {
    const selected = new Date(year, month, day);
    const shouldReset = !startDate || (startDate && endDate);

    if (shouldReset) {
      setStartDate(selected);
      setEndDate(null);
      return;
    }

    if (selected < startDate) {
      setStartDate(selected);
      return;
    }

    setEndDate(selected);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onSelect(formatDate(startDate), formatDate(endDate));
      onClose();
    } else if (startDate) {
      onSelect(formatDate(startDate), formatDate(startDate));
      onClose();
    }
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const isSelected = (day: number, month: number, year: number) => {
    const d = new Date(year, month, day).getTime();
    return startDate?.getTime() === d || endDate?.getTime() === d;
  };

  const isInRange = (day: number, month: number, year: number) => {
    if (!startDate || !endDate) return false;
    const d = new Date(year, month, day).getTime();
    return d > startDate.getTime() && d < endDate.getTime();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="bg-white dark:bg-background-dark w-full max-w-md rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl border-t border-white/10 dark:border-white/5"
        >
          <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <CalendarIcon className="text-primary" size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {currentLang === 'th' ? 'เลือกช่วงเวลา' : 'Select Date Range'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Display selected range */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <DateDisplay label={currentLang === 'th' ? 'เริ่มต้น' : 'Start'} date={startDate} lang={currentLang} />
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
              <DateDisplay label={currentLang === 'th' ? 'สิ้นสุด' : 'End'} date={endDate} lang={currentLang} />
            </div>

            {/* Calendar Control */}
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-700 dark:text-slate-100">
                {currentLang === 'th' ? THAI_MONTHS[currentDate.getMonth()] : EN_MONTHS[currentDate.getMonth()]}{' '}
                {currentDate.getFullYear() + (currentLang === 'th' ? 543 : 0)}
              </h4>
              <div className="flex gap-1">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div
                  key={`${day}-${i}`}
                  className="h-8 flex items-center justify-center text-[10px] font-bold text-slate-400"
                >
                  {day}
                </div>
              ))}
              {calendarData.map((item, i) => {
                const selected = isSelected(item.day, item.month, item.year);
                const inRange = isInRange(item.day, item.month, item.year);
                return (
                  <button
                    key={`${item.year}-${item.month}-${item.day}`}
                    onClick={() => handleDateClick(item.day, item.month, item.year)}
                    className={`h-10 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center ${
                      item.isCurrentMonth ? 'text-slate-700 dark:text-slate-100' : 'text-slate-300 dark:text-white/40'
                    } ${selected ? 'bg-primary text-white shadow-lg shadow-primary/30 z-10' : ''} ${
                      inRange ? 'bg-primary/10 text-primary rounded-none' : ''
                    }`}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleApply}
              disabled={!startDate}
              className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            >
              {currentLang === 'th' ? 'ยืนยัน' : 'Apply'}
            </button>
          </div>
          <div className="h-8" /> {/* Safe area padding */}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DateDisplay({ label, date, lang }: Readonly<{ label: string; date: Date | null; lang: 'th' | 'en' }>) {
  const locale = lang === 'th' ? 'th-TH' : 'en-US';
  const dateString = date ? date.toLocaleDateString(locale) : '-';

  return (
    <div className="flex-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 mb-0.5">
        {label}
      </p>
      <p className="text-sm font-black text-slate-700 dark:text-slate-100">{dateString}</p>
    </div>
  );
}

function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days = [];
  // Previous month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, month: month - 1, year, isCurrentMonth: false });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month, year, isCurrentMonth: true });
  }
  // Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, month: month + 1, year, isCurrentMonth: false });
  }
  return days;
}
