import { useEffect, useState, useCallback } from 'react';
import { useHouseholdStore } from '@/stores/householdStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, Wallet, Zap, Phone, Wifi, Droplets, Flame, Home, MoreHorizontal, TrendingUp } from 'lucide-react';
import type { Expense, ExpenseCategory, Budget, PeriodType } from '@/types/database';
import { clsx } from 'clsx';

const CATEGORIES: { key: ExpenseCategory; label: string; icon: typeof Zap; color: string }[] = [
  { key: 'electricity', label: 'Luz', icon: Zap, color: 'text-warning-500' },
  { key: 'phone', label: 'Teléfono', icon: Phone, color: 'text-primary-500' },
  { key: 'internet', label: 'Internet', icon: Wifi, color: 'text-accent-500' },
  { key: 'water', label: 'Agua', icon: Droplets, color: 'text-primary-400' },
  { key: 'gas', label: 'Gas', icon: Flame, color: 'text-danger-500' },
  { key: 'rent', label: 'Renta', icon: Home, color: 'text-success-500' },
  { key: 'other', label: 'Otro', icon: MoreHorizontal, color: 'text-surface-500' },
];

const PERIODS: { key: PeriodType; label: string }[] = [
  { key: 'weekly', label: 'Semanal' },
  { key: 'biweekly', label: 'Quincenal' },
  { key: 'monthly', label: 'Mensual' },
];

export function ExpensesPage() {
  const { activeHouseholdId } = useHouseholdStore();
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewPeriod, setViewPeriod] = useState<PeriodType>('monthly');

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
    setBudget(data as Budget | null);
  }, [activeHouseholdId]);

  useEffect(() => { fetchExpenses(); fetchBudget(); }, [fetchExpenses, fetchBudget]);

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
    setShowBudgetModal(false); setLoading(false);
    fetchBudget();
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    fetchExpenses();
  };

  // Filtering by period
  const getFilteredExpenses = () => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date);
      if (viewPeriod === 'weekly') {
        const start = new Date(now); start.setDate(now.getDate() - now.getDay());
        const end = new Date(start); end.setDate(start.getDate() + 7);
        return d >= start && d < end;
      }
      if (viewPeriod === 'biweekly') {
        const start = new Date(now); start.setDate(now.getDate() - 14);
        return d >= start && d <= now;
      }
      // monthly
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  };

  const filtered = getFilteredExpenses();
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);
  const bAmount = budget?.amount || 0;
  const isOver = totalFiltered > bAmount && bAmount > 0;
  const pct = bAmount > 0 ? Math.min((totalFiltered / bAmount) * 100, 100) : 0;

  const getCategoryInfo = (key: ExpenseCategory) => CATEGORIES.find((c) => c.key === key) || CATEGORIES[6];

  return (
    <div className="sm:ml-16 lg:ml-56 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Gastos</h1>
          <p className="text-surface-600 text-sm mt-1">Control de gastos y presupuesto</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setBudgetAmount(budget?.amount?.toString() || ''); setBudgetPeriod(budget?.period_type || 'monthly'); setShowBudgetModal(true); }} icon={<TrendingUp size={16} />}>Presupuesto</Button>
          <Button onClick={() => setShowExpenseModal(true)} icon={<Plus size={16} />}>Gasto</Button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 p-1 bg-surface-200 rounded-xl w-fit mb-6">
        {PERIODS.map(({ key, label }) => (
          <button key={key} onClick={() => setViewPeriod(key)}
            className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              viewPeriod === key ? 'bg-surface-50 text-surface-900 shadow-sm' : 'text-surface-600 hover:text-surface-800')}>
            {label}
          </button>
        ))}
      </div>

      {/* Budget Comparison */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-surface-900">Resumen del periodo</h3>
          {budget && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isOver ? 'bg-danger-100 text-danger-600' : 'bg-success-100 text-success-600'}`}>{isOver ? 'Excedido' : 'OK'}</span>}
        </div>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-3xl font-bold text-surface-900">${totalFiltered.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          {budget && <span className="text-surface-500 mb-1">/ ${bAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>}
        </div>
        {budget && (
          <>
            <div className="w-full h-3 bg-surface-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-gradient-to-r from-danger-400 to-danger-600' : 'bg-gradient-to-r from-primary-400 to-primary-600'}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-surface-500 mt-2">{bAmount > totalFiltered ? `Disponible: $${(bAmount - totalFiltered).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : `Excedido por: $${(totalFiltered - bAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}</p>
          </>
        )}
        {!budget && <p className="text-sm text-surface-500">Configura un presupuesto para comparar tus gastos.</p>}
      </Card>

      {/* Expense List */}
      <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wider mb-3">Gastos del periodo ({filtered.length})</h2>
      {filtered.length === 0 ? (
        <Card><p className="text-sm text-surface-500 text-center py-4">No hay gastos registrados en este periodo</p></Card>
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
                    <p className="text-xs text-surface-500">{new Date(exp.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="text-sm font-semibold text-surface-900">${exp.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  <button onClick={() => deleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-danger-500 transition-all cursor-pointer"><Trash2 size={16} /></button>
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
                      category === cat.key ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' : 'bg-surface-100 text-surface-600 hover:bg-surface-200 border-2 border-transparent')}>
                    <Icon size={18} />{cat.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Input label="Monto" type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} icon={<Wallet size={16} />} required />
          <Input label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
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
              {PERIODS.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setBudgetPeriod(key)}
                  className={clsx('flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer',
                    budgetPeriod === key ? 'bg-primary-600 text-white' : 'bg-surface-200 text-surface-600 hover:bg-surface-300')}>
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
