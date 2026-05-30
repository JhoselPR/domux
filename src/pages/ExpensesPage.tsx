import { useEffect, useState, useCallback } from 'react';
import { useHouseholdStore } from '@/stores/householdStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, Wallet, Zap, Phone, Wifi, Droplets, Flame, Home, MoreHorizontal, TrendingUp } from 'lucide-react';
import type { Expense, ExpenseCategory, Budget, PeriodType } from '@/types/database';
import { clsx } from 'clsx';
import { BUDGET_PERIODS, EXPENSE_VIEW_PERIODS, filterExpensesByPeriod, parseExpenseDate, type ExpenseViewPeriod } from '@/lib/expensePeriods';

const CATEGORIES: { key: ExpenseCategory; label: string; icon: typeof Zap; color: string }[] = [
  { key: 'electricity', label: 'Luz', icon: Zap, color: 'text-warning-500' },
  { key: 'phone', label: 'Teléfono', icon: Phone, color: 'text-expenses-500' },
  { key: 'internet', label: 'Internet', icon: Wifi, color: 'text-home-500' },
  { key: 'water', label: 'Agua', icon: Droplets, color: 'text-expenses-500' },
  { key: 'gas', label: 'Gas', icon: Flame, color: 'text-danger-500' },
  { key: 'rent', label: 'Renta', icon: Home, color: 'text-success-500' },
  { key: 'other', label: 'Otro', icon: MoreHorizontal, color: 'text-surface-500' },
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
  const { activeHouseholdId } = useHouseholdStore();
  const { user } = useAuthStore();
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
  const summaryTitle = viewPeriod === 'total' ? 'Resumen total' : 'Resumen del periodo';
  const listTitle = viewPeriod === 'total' ? `Gastos totales (${filtered.length})` : `Gastos del periodo (${filtered.length})`;

  const getCategoryInfo = (key: ExpenseCategory) => CATEGORIES.find((c) => c.key === key) || CATEGORIES[6];

  return (
    <div className="sm:ml-16 lg:ml-56 animate-fade-in">
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-surface-900">Gastos</h1>
          <p className="text-surface-600 text-sm mt-1">Control de gastos y presupuesto</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto sm:justify-end">
          <Button className="flex-1 sm:flex-none" variant="outline" onClick={() => { setBudgetAmount(budget?.amount?.toString() || ''); setBudgetPeriod(budget?.period_type || 'monthly'); setShowBudgetModal(true); }} icon={<TrendingUp size={16} />}>Presupuesto</Button>
          <Button className="flex-1 sm:flex-none" onClick={() => setShowExpenseModal(true)} icon={<Plus size={16} />}>Gasto</Button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 p-1 bg-surface-200 rounded-xl w-fit mb-6">
        {EXPENSE_VIEW_PERIODS.map(({ key, label }) => (
          <button key={key} onClick={() => handleViewPeriodChange(key)}
            className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              viewPeriod === key ? 'bg-expenses-100 text-expenses-600 shadow-sm' : 'text-surface-600 hover:text-surface-800')}>
            {label}
          </button>
        ))}
      </div>

      {/* Budget Comparison */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-surface-900">{summaryTitle}</h3>
          {showBudgetComparison && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isOver ? 'bg-danger-100 text-danger-600' : 'bg-success-100 text-success-600'}`}>{isOver ? 'Excedido' : 'OK'}</span>}
        </div>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-3xl font-bold text-surface-900">${totalFiltered.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          {showBudgetComparison && <span className="text-surface-500 mb-1">/ ${bAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>}
        </div>
        {showBudgetComparison && (
          <>
            <div className="w-full h-3 bg-surface-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-gradient-to-r from-danger-400 to-danger-600' : 'bg-gradient-to-r from-expenses-500 to-tasks-500'}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-surface-500 mt-2">{bAmount > totalFiltered ? `Disponible: $${(bAmount - totalFiltered).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : `Excedido por: $${(totalFiltered - bAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}</p>
          </>
        )}
        {!budget && viewPeriod !== 'total' && <p className="text-sm text-surface-500">Configura un presupuesto para comparar tus gastos.</p>}
        {viewPeriod === 'total' && <p className="text-sm text-surface-500">Incluye todos los gastos registrados, sin comparar contra presupuesto.</p>}
      </Card>

      {/* Expense List */}
      <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wider mb-3">{listTitle}</h2>
      {filtered.length === 0 ? (
        <Card><p className="text-sm text-surface-500 text-center py-4">{viewPeriod === 'total' ? 'No hay gastos registrados' : 'No hay gastos registrados en este periodo'}</p></Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((exp) => {
            const cat = getCategoryInfo(exp.category);
            const Icon = cat.icon;
            return (
              <Card key={exp.id} padding="sm" className="group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center ${cat.color}`}><Icon size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900">{cat.label}{exp.description ? ` – ${exp.description}` : ''}</p>
                    <p className="text-xs text-surface-500">{parseExpenseDate(exp.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="text-sm font-semibold text-surface-900">${exp.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  <button onClick={() => deleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 focus-visible:opacity-100 text-surface-400 hover:text-danger-500 transition-all cursor-pointer" aria-label="Eliminar gasto"><Trash2 size={16} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Registrar gasto">
        <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-700">Categoría</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button key={cat.key} type="button" onClick={() => setCategory(cat.key)}
                    className={clsx('flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all cursor-pointer',
                      category === cat.key ? 'bg-expenses-100 text-expenses-600 border-2 border-expenses-500/40' : 'bg-surface-100 text-surface-600 hover:bg-surface-200 border-2 border-transparent')}>
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
            <label className="text-sm font-medium text-surface-700">Periodo</label>
            <div className="flex gap-2">
              {BUDGET_PERIODS.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setBudgetPeriod(key)}
                  className={clsx('flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer',
                    budgetPeriod === key ? 'bg-expenses-fill text-white' : 'bg-surface-200 text-surface-600 hover:bg-surface-300')}>
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
