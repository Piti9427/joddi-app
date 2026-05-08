import { parseSmartInputLocally } from '../src/lib/smartInput.ts';
import type { LocalCategory } from '../src/lib/supabase.ts';

const categories: LocalCategory[] = [
  {
    id: 'cat-coffee',
    localId: 'cat-coffee',
    name: 'Coffee',
    type: 'Expense',
    iconName: 'Coffee',
    color: 'text-amber-600',
    syncStatus: 'synced',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-food',
    localId: 'cat-food',
    name: 'Food',
    type: 'Expense',
    iconName: 'Utensils',
    color: 'text-rose-500',
    syncStatus: 'synced',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-transport',
    localId: 'cat-transport',
    name: 'Transport',
    type: 'Expense',
    iconName: 'Car',
    color: 'text-blue-500',
    syncStatus: 'synced',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cat-income',
    localId: 'cat-income',
    name: 'Income',
    type: 'Income',
    iconName: 'Banknote',
    color: 'text-primary',
    syncStatus: 'synced',
    updatedAt: new Date().toISOString(),
  },
];

const cases = [
  { text: 'กาแฟ 120 วันนี้', amount: 120, type: 'Expense', category: 'Coffee', needsReview: false },
  { text: 'เงินเดือน 30000', amount: 30000, type: 'Income', category: 'Income', needsReview: false },
  { text: 'grab 230 บัตรเครดิต เมื่อวาน', amount: 230, type: 'Expense', category: 'Transport', paymentMethod: 'card' },
  { text: 'กาแฟวันนี้', amount: null, type: 'Expense', category: 'Coffee', needsReview: true },
] as const;

for (const testCase of cases) {
  const result = parseSmartInputLocally(testCase.text, categories);
  for (const [key, expected] of Object.entries(testCase)) {
    if (key === 'text') continue;
    const actual = result[key as keyof typeof result];
    if (actual !== expected) {
      throw new Error(
        `Smart input fixture failed for "${testCase.text}": expected ${key}=${expected}, got ${String(actual)}`,
      );
    }
  }
}

console.log(`Smart input fixtures passed (${cases.length})`);
