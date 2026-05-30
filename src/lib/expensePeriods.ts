import type { Expense, PeriodType } from '@/types/database';

export type ExpenseViewPeriod = PeriodType | 'total';

export const BUDGET_PERIODS: { key: PeriodType; label: string }[] = [
  { key: 'weekly', label: 'Semanal' },
  { key: 'biweekly', label: 'Quincenal' },
  { key: 'monthly', label: 'Mensual' },
];

export const EXPENSE_VIEW_PERIODS: { key: ExpenseViewPeriod; label: string }[] = [
  ...BUDGET_PERIODS,
  { key: 'total', label: 'Total' },
];

export function getPeriodLabel(period: PeriodType) {
  return BUDGET_PERIODS.find((item) => item.key === period)?.label ?? 'Mensual';
}

export function getPeriodRange(period: PeriodType, today = new Date()) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);

  if (period === 'weekly') {
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  if (period === 'biweekly') {
    start.setDate(start.getDate() - 13);
    const end = new Date(today);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  start.setDate(1);
  const end = new Date(start);
  end.setMonth(start.getMonth() + 1);
  return { start, end };
}

export function parseExpenseDate(date: string) {
  const [year, month, day] = date.split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return new Date(date);
  return new Date(year, month - 1, day);
}

export function isExpenseInPeriod(expense: Expense, period: PeriodType, today = new Date()) {
  const { start, end } = getPeriodRange(period, today);
  const expenseDate = parseExpenseDate(expense.date);
  return expenseDate >= start && expenseDate < end;
}

export function filterExpensesByPeriod(expenses: Expense[], period: ExpenseViewPeriod, today = new Date()) {
  if (period === 'total') return expenses;
  return expenses.filter((expense) => isExpenseInPeriod(expense, period, today));
}

export function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
