import { useEffect, useState } from 'react';
import { useHouseholdStore } from '@/stores/householdStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ArrowRight, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Task, PantryItem, Expense, Budget } from '@/types/database';
import { filterExpensesByPeriod, formatLocalDate, getPeriodLabel, getPeriodRange } from '@/lib/expensePeriods';
import { formatMoney } from '@/lib/format';
import { clsx } from 'clsx';

export function DashboardPage() {
  const { activeHouseholdId, activeHousehold } = useHouseholdStore();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const household = activeHousehold();

  useEffect(() => {
    if (!activeHouseholdId) return;
    const fetchDashboard = async () => {
      const [{ data: taskData, count: taskCount }, { data: pantryData }, { data: budgetData }, { count }] = await Promise.all([
        supabase.from('tasks').select('*', { count: 'exact' }).eq('household_id', activeHouseholdId).eq('status', 'pending').limit(5),
        supabase.from('pantry_items').select('*').eq('household_id', activeHouseholdId).eq('is_bought', false),
        supabase.from('budgets').select('*').eq('household_id', activeHouseholdId).limit(1).single(),
        supabase.from('household_members').select('*', { count: 'exact', head: true }).eq('household_id', activeHouseholdId),
      ]);
      const budgetDataTyped = budgetData as Budget | null;
      const monthlyRange = getPeriodRange('monthly');
      const budgetRange = budgetDataTyped ? getPeriodRange(budgetDataTyped.period_type) : monthlyRange;
      const expenseStart = budgetRange.start < monthlyRange.start ? budgetRange.start : monthlyRange.start;
      const { data: expenseData } = await supabase.from('expenses').select('*').eq('household_id', activeHouseholdId).gte('date', formatLocalDate(expenseStart));
      setTasks((taskData as Task[]) || []);
      setPendingCount(taskCount || 0);
      setPantryItems((pantryData as PantryItem[]) || []);
      setExpenses((expenseData as Expense[]) || []);
      setBudget(budgetData as Budget | null);
      setMemberCount(count || 0);
    };
    fetchDashboard();
  }, [activeHouseholdId]);

  const monthlyExpenses = filterExpensesByPeriod(expenses, 'monthly');
  const budgetExpenses = budget ? filterExpensesByPeriod(expenses, budget.period_type) : monthlyExpenses;
  const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetTotalExpenses = budgetExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetAmount = budget?.amount || 0;
  const budgetUsedPercent = budgetAmount > 0 ? Math.min((budgetTotalExpenses / budgetAmount) * 100, 100) : 0;
  const isOverBudget = budgetTotalExpenses > budgetAmount && budgetAmount > 0;

  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const stats = [
    { label: 'Tareas pendientes', value: pendingCount.toString(), to: '/tasks' },
    { label: 'Por comprar', value: pantryItems.length.toString(), to: '/pantry' },
    { label: 'Gastos del mes', value: formatMoney(totalExpenses), to: '/expenses' },
    { label: 'Miembros', value: memberCount.toString() },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title={household?.household?.name || 'Selecciona un hogar'} subtitle={today.charAt(0).toUpperCase() + today.slice(1)} />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, to }) => (
          <Card key={label} hover={!!to} onClick={to ? () => navigate(to) : undefined}>
            <p className="text-sm text-ink-2">{label}</p>
            <p className="mt-2 text-2xl font-medium tabular-nums text-ink sm:text-3xl">{value}</p>
          </Card>
        ))}
      </div>

      {budget && (
        <Card padding="lg" className="mb-4">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="text-sm font-medium text-ink-2">Presupuesto ({getPeriodLabel(budget.period_type).toLowerCase()})</h3>
            <span className={clsx('text-sm', isOverBudget ? 'font-medium text-danger' : 'text-ink-3')}>{isOverBudget ? 'Excedido' : 'En presupuesto'}</span>
          </div>
          <div className="mb-4 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-4xl font-medium tabular-nums text-ink">{formatMoney(budgetTotalExpenses)}</span>
            <span className="text-sm tabular-nums text-ink-3">de {formatMoney(budgetAmount)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-raised">
            <div className={clsx('h-full rounded-full', isOverBudget ? 'bg-danger' : 'bg-ink')} style={{ width: `${budgetUsedPercent}%` }} />
          </div>
          <p className="mt-2 text-sm tabular-nums text-ink-3">{budgetAmount > budgetTotalExpenses ? `Quedan ${formatMoney(budgetAmount - budgetTotalExpenses)}` : `Excedido por ${formatMoney(budgetTotalExpenses - budgetAmount)}`}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <ListHeader title="Tareas pendientes" action="Ver todas" onClick={() => navigate('/tasks')} />
          {tasks.length === 0 ? <p className="py-4 text-sm text-ink-3">No hay tareas pendientes</p> : (
            <div className="divide-y divide-line">{tasks.map((task) => (<div key={task.id} className="flex h-10 items-center gap-2"><Circle size={16} className="shrink-0 text-ink-3" /><span className="truncate text-sm text-ink">{task.title}</span></div>))}</div>
          )}
        </Card>
        <Card>
          <ListHeader title="Lista de despensa" action="Ver todo" onClick={() => navigate('/pantry')} />
          {pantryItems.length === 0 ? <p className="py-4 text-sm text-ink-3">No hay nada pendiente por comprar</p> : (
            <div className="divide-y divide-line">{pantryItems.slice(0, 5).map((item) => (<div key={item.id} className="flex h-10 items-center gap-2"><Circle size={16} className="shrink-0 text-ink-3" /><span className="truncate text-sm text-ink">{item.name}</span>{item.quantity > 1 && <span className="ml-auto font-mono text-xs tabular-nums text-ink-3">×{item.quantity}</span>}</div>))}</div>
          )}
        </Card>
      </div>
    </div>
  );
}

interface ListHeaderProps {
  title: string;
  action: string;
  onClick: () => void;
}

function ListHeader({ title, action, onClick }: ListHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-medium text-ink-2">{title}</h3>
      <button onClick={onClick} className="-mr-2 flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm text-ink-3 transition-colors hover:bg-raised hover:text-ink">
        {action}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
