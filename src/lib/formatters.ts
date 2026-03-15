const FALLBACK_LOCALE = 'en-US';
const FALLBACK_CURRENCY = 'USD';

function getStoredCurrency() {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem('currency');
  return stored && stored.length === 3 ? stored.toUpperCase() : null;
}

export function getUserLocale() {
  if (typeof navigator === 'undefined') return FALLBACK_LOCALE;
  return navigator.language || FALLBACK_LOCALE;
}

export function getUserCurrency(locale = getUserLocale()) {
  const stored = getStoredCurrency();
  if (stored) return stored;

  if (locale.toLowerCase().startsWith('th')) return 'THB';
  return FALLBACK_CURRENCY;
}

export function formatMoney(
  value: number,
  options?: {
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
    currency?: string;
    locale?: string;
    compact?: boolean;
  },
) {
  const locale = options?.locale ?? getUserLocale();
  const currency = options?.currency ?? getUserCurrency(locale);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: options?.minimumFractionDigits,
    notation: options?.compact ? 'compact' : 'standard',
  }).format(value);
}

export function formatDateShort(dateInput: string | number | Date, locale = getUserLocale()) {
  return new Date(dateInput).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export function getCurrencySymbol(locale = getUserLocale(), currency = getUserCurrency(locale)) {
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(0);

  return parts.find((part) => part.type === 'currency')?.value ?? '$';
}
