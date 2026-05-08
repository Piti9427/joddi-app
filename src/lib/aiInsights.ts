import type { Transaction } from '../App';
import { formatMoney } from './formatters';

export type AiInsightTone = 'positive' | 'warning' | 'neutral';

export type AiInsight = {
  title: string;
  summary: string;
  actionLabel: string;
  tone: AiInsightTone;
  confidence: number;
};

function isCurrentMonth(date: Date, now: Date) {
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

export function getLocalAiInsight(transactions: Transaction[]): AiInsight {
  const now = new Date();
  const monthExpenses = new Map<string, number>();
  let monthIncome = 0;
  let monthExpense = 0;
  let todayExpense = 0;

  for (const transaction of transactions) {
    const date = new Date(transaction.date);
    if (!isCurrentMonth(date, now)) continue;

    if (transaction.type === 'Income') {
      monthIncome += transaction.amount;
      continue;
    }

    monthExpense += transaction.amount;
    monthExpenses.set(transaction.category, (monthExpenses.get(transaction.category) ?? 0) + transaction.amount);

    if (date.toDateString() === now.toDateString()) {
      todayExpense += transaction.amount;
    }
  }

  if (transactions.length === 0) {
    return {
      title: 'AI Coach is ready',
      summary: 'Start with one quick entry. I will surface spending patterns after your first few records.',
      actionLabel: 'Add first entry',
      tone: 'neutral',
      confidence: 0.58,
    };
  }

  const topCategory = [...monthExpenses.entries()].sort((a, b) => b[1] - a[1])[0];
  const spendRate = monthIncome > 0 ? monthExpense / monthIncome : 0;

  if (spendRate >= 0.85) {
    return {
      title: 'Budget pressure detected',
      summary: `This month spending is ${Math.round(spendRate * 100)}% of income. Check limits before adding more variable expenses.`,
      actionLabel: 'Review budget',
      tone: 'warning',
      confidence: 0.86,
    };
  }

  if (topCategory && topCategory[1] > monthExpense * 0.42) {
    return {
      title: `${topCategory[0]} is leading spend`,
      summary: `${formatMoney(topCategory[1])} is concentrated in one category this month. A small cap here has the biggest impact.`,
      actionLabel: 'Tune category',
      tone: 'warning',
      confidence: 0.8,
    };
  }

  if (todayExpense === 0) {
    return {
      title: 'No spend logged today',
      summary: 'Today is still clean. Add income or expense with Smart Add when something happens.',
      actionLabel: 'Smart Add',
      tone: 'positive',
      confidence: 0.76,
    };
  }

  return {
    title: 'Cashflow looks controlled',
    summary: `Today expense is ${formatMoney(todayExpense)} and month net is ${formatMoney(monthIncome - monthExpense)}.`,
    actionLabel: 'View analytics',
    tone: monthIncome >= monthExpense ? 'positive' : 'neutral',
    confidence: 0.78,
  };
}
