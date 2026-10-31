import { useEffect, useState, useCallback } from 'react';
import { useHouseholdStore } from '@/stores/householdStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, SectionTitle } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { Plus, Trash2, Wallet, Zap, Phone, Wifi, Droplets, Flame, Home, MoreHorizontal, TrendingUp } from 'lucide-react';
import type { Expense, ExpenseCategory, Budget, PeriodType } from '@/types/database';
import { clsx } from 'clsx';
import { BUDGET_PERIODS, EXPENSE_VIEW_PERIODS, filterExpensesByPeriod, parseExpenseDate, type ExpenseViewPeriod } from '@/lib/expensePeriods';
import { formatMoney } from '@/lib/format';

const CATEGORIES: { key: ExpenseCategory; label: string; icon: typeof Zap }[] = [
  { key: 'electricity', label: 'Luz', icon: Zap },
  { key: 'phone', label: 'Teléfono', icon: Phone },
  { key: 'internet', label: 'Internet', icon: Wifi },
  { key: 'water', label: 'Agua', icon: Droplets },
  { key: 'gas', label: 'Gas', icon: Flame },
  { key: 'rent', label: 'Renta', icon: Home },
  { key: 'other', label: 'Otro', icon: MoreHorizontal },
];

const EXPENSE_VIEW_PERIOD_STORAGE_KEY = 'domux:expenses:view-period:v1';

function isExpenseViewPeriod(value: string | null): value is ExpenseViewPeriod {
  return EXPENSE_VIEW_PERIODS.some((period) => period.key === value);
}

function getStoredExpenseViewPeriod(): ExpenseViewPeriod | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(EXPENSE_VIEW_PERIOD_STORAGE_KEY);
    return isExpenseViewPeriod(stored) ? stored : null;
  } catch {
    return null;
  }
}

function saveExpenseViewPeriod(period: ExpenseViewPeriod) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(EXPENSE_VIEW_PERIOD_STORAGE_KEY, period);
  } catch {
    // Browsers can block localStorage in private or restricted contexts.
  }
}

export function ExpensesPage() {
  const { activeHouseholdId, activeHousehold } = useHouseholdStore();
  const { user } = useAuthStore();
  const householdName = activeHousehold()?.household?.name;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewPeriod, setViewPeriod] = useState<ExpenseViewPeriod>(() => getStoredExpenseViewPeriod() ?? 'monthly');

  // Expense form
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Budget form
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<PeriodType>('monthly');

  const fetchExpenses = useCallback(async () => {
    if (!activeHouseholdId) return;
    const { data } = await supabase.from('expenses').select('*')
      .eq('household_id', activeHouseholdId).order('date', { ascending: false });
    setExpenses((data as Expense[]) || []);
  }, [activeHouseholdId]);

  const fetchBudget = useCallback(async () => {
    if (!activeHouseholdId) return;
    const { data } = await supabase.from('budgets').select('*')
      .eq('household_id', activeHouseholdId).limit(1).single();
    const nextBudget = data as Budget | null;
    setBudget(nextBudget);

    if (nextBudget && getStoredExpenseViewPeriod() === null) {
      setViewPeriod(nextBudget.period_type);
    }
  }, [activeHouseholdId]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchExpenses(), fetchBudget()]);
    };

    void load();
  }, [fetchExpenses, fetchBudget]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHouseholdId || !user) return;
    setLoading(true);
    await supabase.from('expenses').insert({
      household_id: activeHouseholdId, category, amount: parseFloat(amount),
      date, description: description || null, created_by: user.id,
    });
    setAmount(''); setDescription(''); setCategory('other'); setShowExpenseModal(false); setLoading(false);
    fetchExpenses();
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHouseholdId) return;
    setLoading(true);
    if (budget) {
      await supabase.from('budgets').update({ amount: parseFloat(budgetAmount), period_type: budgetPeriod, updated_at: new Date().toISOString() }).eq('id', budget.id);
    } else {
      await supabase.from('budgets').insert({ household_id: activeHouseholdId, amount: parseFloat(budgetAmount), period_type: budgetPeriod });
    }
    setViewPeriod(budgetPeriod);
    saveExpenseViewPeriod(budgetPeriod);
    setShowBudgetModal(false); setLoading(false);
    fetchBudget();
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    fetchExpenses();
  };

  const handleViewPeriodChange = (period: ExpenseViewPeriod) => {
    setViewPeriod(period);
    saveExpenseViewPeriod(period);
  };

  const filtered = filterExpensesByPeriod(expenses, viewPeriod);
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);
  const bAmount = budget?.amount || 0;
  const showBudgetComparison = viewPeriod !== 'total' && budget !== null;
  const isOver = showBudgetComparison ? totalFiltered > bAmount && bAmount > 0 : false;
  const pct = showBudgetComparison && bAmount > 0 ? Math.min((totalFiltered / bAmount) * 100, 100) : 0;
  const periodLabel = EXPENSE_VIEW_PERIODS.find((period) => period.key === viewPeriod)?.label;
  const listTitle = viewPeriod === 'total' ? 'Gastos totales' : 'Gastos del periodo';
  const breakdown = CATEGORIES
    .map((cat) => ({ ...cat, total: filtered.filter((e) => e.category === cat.key).reduce((s, e) => s + e.amount, 0) }))
    .filter((cat) => cat.total > 0)
    .sort((a, b) => b.total - a.total);

  const getCategoryInfo = (key: ExpenseCategory) => CATEGORIES.find((c) => c.key === key) || CATEGORIES[6];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gastos"
        subtitle="En qué se va el dinero de la casa"
        actions={
          <>
            <Button className="flex-1 sm:flex-none" variant="outline" onClick={() => { setBudgetAmount(budget?.amount?.toString() || ''); setBudgetPeriod(budget?.period_type || 'monthly'); setShowBudgetModal(true); }} icon={<TrendingUp size={16} />}>Presupuesto</Button>
            <Button className="flex-1 sm:flex-none" onClick={() => setShowExpenseModal(true)} icon={<Plus size={16} />}>Gasto</Button>
          </>
        }
      />

      {/* Period Tabs */}
      <Segmented className="mb-8" value={viewPeriod} onChange={handleViewPeriodChange} options={EXPENSE_VIEW_PERIODS} />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Budget Comparison */}
        <div className="ticket-shadow mx-auto w-full max-w-sm lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:max-w-none">
          <div className="ticket px-5 pb-8 pt-5 font-mono text-[13px] leading-5">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <span className="truncate font-medium">{householdName || 'Domux'}</span>
              <span className="shrink-0 text-paper-ink-2">{periodLabel}</span>
            </div>
            <div className="border-t border-dashed border-paper-line py-3">
              {breakdown.length === 0 ? (
                <p className="text-paper-ink-2">Sin gastos</p>
              ) : (
                breakdown.map(({ key, label, total }) => (
                  <div key={key} className="flex justify-between gap-4">
                    <span>{label}</span>
                    <span className="tabular-nums">{formatMoney(total)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-paper-line pt-3 font-medium">
              <span>Total</span>
              <span className="text-xl tabular-nums">{formatMoney(totalFiltered)}</span>
            </div>
            {showBudgetComparison && (
              <div className="mt-3 border-t border-dashed border-paper-line pt-3">
                <div className="flex justify-between gap-4 text-paper-ink-2">
                  <span>Presupuesto</span>
                  <span className="tabular-nums">{formatMoney(bAmount)}</span>
                </div>
                <div className={clsx('flex justify-between gap-4', isOver && 'font-medium text-paper-danger')}>
                  <span>{isOver ? 'Excedido por' : 'Disponible'}</span>
                  <span className="tabular-nums">{formatMoney(Math.abs(bAmount - totalFiltered))}</span>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-paper-line">
                  <div className={clsx('h-full', isOver ? 'bg-paper-danger' : 'bg-paper-ink')} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
            {!budget && viewPeriod !== 'total' && <p className="mt-3 text-paper-ink-2">Configura un presupuesto para comparar tus gastos</p>}
          </div>
        </div>

        {/* Expense List */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <SectionTitle count={filtered.length}>{listTitle}</SectionTitle>
          {filtered.length === 0 ? (
            <Card><p className="text-sm text-ink-3">{viewPeriod === 'total' ? 'No hay gastos registrados' : 'No hay gastos registrados en este periodo'}</p></Card>
          ) : (
            <Card padding="none" className="divide-y divide-line">
              {filtered.map((exp) => {
                const cat = getCategoryInfo(exp.category);
                const Icon = cat.icon;
                return (
                  <div key={exp.id} className="group flex min-h-14 items-center gap-3 px-4 py-2">
                    <Icon size={18} className="shrink-0 text-ink-3" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{cat.label}{exp.description ? ` – ${exp.description}` : ''}</p>
                      <p className="mt-0.5 text-xs text-ink-3">{parseExpenseDate(exp.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className="font-mono text-sm tabular-nums text-ink">{formatMoney(exp.amount)}</span>
                    <button onClick={() => deleteExpense(exp.id)} className="cursor-pointer text-ink-3 transition-[color,opacity] hover:text-danger focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0" aria-label="Eliminar gasto"><Trash2 size={16} /></button>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Registrar gasto">
        <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-2">Categoría</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button key={cat.key} type="button" onClick={() => setCategory(cat.key)}
                    className={clsx('flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors',
                      category === cat.key ? 'border-accent bg-accent-soft font-medium text-ink' : 'border-transparent bg-raised text-ink-2 hover:text-ink')}>
                    <Icon size={18} />{cat.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Input label="Monto" type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} icon={<Wallet size={16} />} required />
          <DateInput label="Fecha" value={date} onChange={setDate} required />
          <Input label="Descripción (opcional)" placeholder="Ej: Recibo de mayo" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit" loading={loading} fullWidth>Registrar gasto</Button>
        </form>
      </Modal>

      {/* Budget Modal */}
      <Modal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} title="Configurar presupuesto">
        <form onSubmit={handleSaveBudget} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-2">Periodo</label>
            <div className="flex gap-2">
              {BUDGET_PERIODS.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setBudgetPeriod(key)}
                  className={clsx('h-10 flex-1 cursor-pointer rounded-lg text-sm font-medium transition-colors',
                    budgetPeriod === key ? 'bg-primary text-on-primary' : 'bg-raised text-ink-2 hover:text-ink')}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Input label="Monto del presupuesto" type="number" step="0.01" min="0" placeholder="0.00" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} icon={<TrendingUp size={16} />} required />
          <Button type="submit" loading={loading} fullWidth>{budget ? 'Actualizar' : 'Guardar'} presupuesto</Button>
        </form>
      </Modal>
    </div>
  );
}
