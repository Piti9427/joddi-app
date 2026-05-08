import type { TransactionType } from '../App';
import type { LocalCategory } from './supabase';

export const SMART_INPUT_PREFILL_KEY = 'joddi_smart_input_prefill';

export type SmartInputParseResult = {
  type: TransactionType;
  amount: number | null;
  category?: string;
  merchant?: string;
  note?: string;
  date?: string;
  paymentMethod?: string;
  confidence: number;
  needsReview: boolean;
};

export type SmartInputPrefill = SmartInputParseResult & {
  rawText: string;
};

type GeminiParseResponse = Partial<SmartInputParseResult>;

const INCOME_KEYWORDS = [
  'salary',
  'income',
  'payday',
  'paid',
  'bonus',
  'freelance',
  'ได้เงิน',
  'เงินเดือน',
  'รายรับ',
  'รับเงิน',
  'โบนัส',
  'ค่าจ้าง',
];

const EXPENSE_KEYWORDS = [
  'buy',
  'paid',
  'spent',
  'expense',
  'coffee',
  'food',
  'grab',
  'ซื้อ',
  'จ่าย',
  'ค่า',
  'กาแฟ',
  'ข้าว',
  'อาหาร',
];

const CATEGORY_HINTS: Record<string, string[]> = {
  Coffee: ['coffee', 'cafe', 'กาแฟ', 'คาเฟ่', 'ลาเต้', 'อเมริกาโน่'],
  Food: ['food', 'meal', 'lunch', 'dinner', 'breakfast', 'ข้าว', 'อาหาร', 'มื้อ', 'กิน'],
  Transport: ['grab', 'taxi', 'bts', 'mrt', 'รถ', 'แท็กซี่', 'เดินทาง', 'น้ำมัน'],
  Bills: ['bill', 'electric', 'water', 'internet', 'ค่าไฟ', 'ค่าน้ำ', 'เน็ต', 'บิล'],
  Shopping: ['shopping', 'shop', 'mall', 'ซื้อ', 'ช้อป', 'เสื้อ', 'ของใช้'],
  Health: ['health', 'hospital', 'clinic', 'ยา', 'หมอ', 'โรงพยาบาล', 'คลินิก'],
  Income: ['salary', 'income', 'เงินเดือน', 'รายรับ', 'รับเงิน'],
  Gifts: ['gift', 'ของขวัญ', 'อั่งเปา'],
  Freelance: ['freelance', 'project', 'ค่าจ้าง', 'ฟรีแลนซ์'],
};

const PAYMENT_HINTS: Array<{ id: string; keywords: string[] }> = [
  { id: 'cash', keywords: ['cash', 'เงินสด'] },
  { id: 'bank', keywords: ['bank', 'transfer', 'โอน', 'ธนาคาร'] },
  { id: 'card', keywords: ['card', 'credit', 'debit', 'บัตร', 'เครดิต'] },
  { id: 'ewallet', keywords: ['wallet', 'true money', 'truemoney', 'e-wallet', 'วอลเล็ต'] },
  { id: 'promptpay', keywords: ['promptpay', 'พร้อมเพย์'] },
];

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function lower(value: string) {
  return value.toLocaleLowerCase('th-TH');
}

function parseAmount(text: string): number | null {
  const match = text.match(/(?:฿|บาท|thb)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseDate(text: string): string {
  const normalized = lower(text);
  const date = new Date();

  if (normalized.includes('เมื่อวาน') || normalized.includes('yesterday')) {
    date.setDate(date.getDate() - 1);
  } else if (normalized.includes('พรุ่งนี้') || normalized.includes('tomorrow')) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().slice(0, 10);
}

function inferType(text: string): TransactionType {
  const normalized = lower(text);
  const incomeScore = INCOME_KEYWORDS.filter((keyword) => normalized.includes(keyword)).length;
  const expenseScore = EXPENSE_KEYWORDS.filter((keyword) => normalized.includes(keyword)).length;
  return incomeScore > expenseScore ? 'Income' : 'Expense';
}

function inferPaymentMethod(text: string) {
  const normalized = lower(text);
  return PAYMENT_HINTS.find((hint) => hint.keywords.some((keyword) => normalized.includes(keyword)))?.id ?? 'cash';
}

function inferCategory(text: string, type: TransactionType, categories: LocalCategory[]) {
  const normalized = lower(text);
  const available = categories.filter((category) => category.type === type);

  const directMatch = available.find((category) => normalized.includes(lower(category.name)));
  if (directMatch) return directMatch.name;

  for (const category of available) {
    const hints = CATEGORY_HINTS[category.name] ?? [];
    if (hints.some((hint) => normalized.includes(lower(hint)))) return category.name;
  }

  return available[0]?.name ?? (type === 'Income' ? 'Income' : 'Misc');
}

function inferMerchant(text: string, amount: number | null) {
  let merchant = normalizeText(text)
    .replace(/(?:฿|บาท|thb)?\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?/i, '')
    .replace(/\b(today|yesterday|tomorrow|cash|card|credit|debit|bank|transfer|promptpay)\b/gi, '')
    .replace(/วันนี้|เมื่อวาน|พรุ่งนี้|เงินสด|บัตรเครดิต|บัตร|โอน|พร้อมเพย์/g, '')
    .trim();

  merchant = merchant.split(' ').slice(0, 4).join(' ');
  if (merchant.length === 0 && amount) return 'Quick Add';
  return merchant || undefined;
}

function calculateConfidence(result: Omit<SmartInputParseResult, 'confidence' | 'needsReview'>, rawText: string) {
  let score = 0.2;
  if (result.amount && result.amount > 0) score += 0.35;
  if (result.category) score += 0.2;
  if (result.merchant && result.merchant !== 'Quick Add') score += 0.1;
  if (result.paymentMethod) score += 0.05;
  if (rawText.trim().length >= 5) score += 0.1;
  return Math.min(score, 0.95);
}

function sanitizeGeminiResponse(response: GeminiParseResponse, fallback: SmartInputParseResult): SmartInputParseResult {
  const type = response.type === 'Income' || response.type === 'Expense' ? response.type : fallback.type;
  const amount = typeof response.amount === 'number' && response.amount > 0 ? response.amount : fallback.amount;
  const confidence =
    typeof response.confidence === 'number' && Number.isFinite(response.confidence)
      ? Math.max(0, Math.min(response.confidence, 1))
      : fallback.confidence;

  return {
    ...fallback,
    ...response,
    type,
    amount,
    date: response.date || fallback.date,
    paymentMethod: response.paymentMethod || fallback.paymentMethod,
    confidence,
    needsReview: !amount || confidence < 0.74 || response.needsReview === true,
  };
}

export function parseSmartInputLocally(rawText: string, categories: LocalCategory[]): SmartInputParseResult {
  const text = normalizeText(rawText);
  const amount = parseAmount(text);
  const type = inferType(text);
  const category = inferCategory(text, type, categories);
  const merchant = inferMerchant(text, amount);
  const paymentMethod = inferPaymentMethod(text);
  const date = parseDate(text);
  const base = {
    type,
    amount,
    category,
    merchant,
    note: text,
    date,
    paymentMethod,
  };
  const confidence = calculateConfidence(base, text);

  return {
    ...base,
    confidence,
    needsReview: !amount || confidence < 0.74,
  };
}

export async function parseSmartInput(rawText: string, categories: LocalCategory[]): Promise<SmartInputParseResult> {
  const localResult = parseSmartInputLocally(rawText, categories);
  const endpoint = String(import.meta.env.VITE_SMART_INPUT_ENDPOINT || '').trim();

  if (!endpoint || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return localResult;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: rawText,
        categories: categories.map((category) => ({ name: category.name, type: category.type })),
        localResult,
      }),
    });

    if (!response.ok) return localResult;

    const data = (await response.json()) as GeminiParseResponse;
    return sanitizeGeminiResponse(data, localResult);
  } catch (error) {
    console.warn('Smart input endpoint unavailable; using local parser', error);
    return localResult;
  }
}

export function toTransactionDraft(result: SmartInputParseResult) {
  return {
    type: result.type,
    amount: result.amount ?? 0,
    category: result.category || (result.type === 'Income' ? 'Income' : 'Misc'),
    note: result.note || '',
    date: result.date || new Date().toISOString().slice(0, 10),
    merchant: result.merchant || result.category || 'Quick Add',
    paymentMethod: result.paymentMethod || 'cash',
  };
}
