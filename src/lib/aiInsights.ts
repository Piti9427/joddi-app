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
      title: 'ผู้ช่วย AI พร้อมเริ่มแล้ว',
      summary: 'เริ่มจากบันทึกรายการแรกก่อน แล้วระบบจะค่อย ๆ สรุปแพตเทิร์นการใช้เงินให้จากข้อมูลจริงของคุณ',
      actionLabel: 'เพิ่มรายการแรก',
      tone: 'neutral',
      confidence: 0.58,
    };
  }

  const topCategory = [...monthExpenses.entries()].sort((a, b) => b[1] - a[1])[0];
  const spendRate = monthIncome > 0 ? monthExpense / monthIncome : 0;

  if (spendRate >= 0.85) {
    return {
      title: 'รายจ่ายเดือนนี้เริ่มกดดันงบ',
      summary: `เดือนนี้ใช้ไปแล้ว ${Math.round(spendRate * 100)}% ของรายรับ แนะนำให้เช็กงบก่อนเพิ่มรายจ่ายยืดหยุ่น`,
      actionLabel: 'ดูงบประมาณ',
      tone: 'warning',
      confidence: 0.86,
    };
  }

  if (topCategory && topCategory[1] > monthExpense * 0.42) {
    return {
      title: `${topCategory[0]} เป็นหมวดที่ใช้เยอะสุด`,
      summary: `เดือนนี้ใช้กับหมวดนี้ ${formatMoney(topCategory[1])} ถ้าลดหรือกำหนดเพดานเล็กน้อยจะเห็นผลชัดที่สุด`,
      actionLabel: 'ปรับหมวดหมู่',
      tone: 'warning',
      confidence: 0.8,
    };
  }

  if (todayExpense === 0) {
    return {
      title: 'วันนี้ยังไม่มีรายจ่าย',
      summary: 'วันนี้ยังไม่มีรายการออก ถ้ามีรายรับหรือรายจ่ายใหม่ให้พิมพ์ผ่านช่องเพิ่มอัจฉริยะได้ทันที',
      actionLabel: 'เพิ่มด้วย AI',
      tone: 'positive',
      confidence: 0.76,
    };
  }

  return {
    title: 'กระแสเงินสดยังคุมได้',
    summary: `วันนี้ใช้ไป ${formatMoney(todayExpense)} และยอดสุทธิเดือนนี้อยู่ที่ ${formatMoney(monthIncome - monthExpense)}`,
    actionLabel: 'ดูวิเคราะห์',
    tone: monthIncome >= monthExpense ? 'positive' : 'neutral',
    confidence: 0.78,
  };
}
