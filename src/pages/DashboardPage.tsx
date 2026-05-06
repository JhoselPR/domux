import { useEffect, useState } from 'react';
import { useHouseholdStore } from '@/stores/householdStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { ListTodo, ShoppingCart, Wallet, Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Task, PantryItem, Expense, Budget } from '@/types/database';

export function DashboardPage() {
  const { activeHouseholdId, activeHousehold } = useHouseholdStore();
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const household = activeHousehold();

  useEffect(() => {
    if (!activeHouseholdId) return;
    const fetchDashboard = async () => {
      const { data: taskData } = await supabase.from('tasks').select('*').eq('household_id', activeHouseholdId).eq('status', 'pending').limit(5);
      setTasks((taskData as Task[]) || []);
      const { data: pantryData } = await supabase.from('pantry_items').select('*').eq('household_id', activeHouseholdId).eq('is_bought', false);
      setPantryItems((pantryData as PantryItem[]) || []);
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
      const { data: expenseData } = await supabase.from('expenses').select('*').eq('household_id', activeHouseholdId).gte('date', startOfMonth.toISOString());
      setExpenses((expenseData as Expense[]) || []);
      const { data: budgetData } = await supabase.from('budgets').select('*').eq('household_id', activeHouseholdId).limit(1).single();
      setBudget(budgetData as Budget | null);
      const { count } = await supabase.from('household_members').select('*', { count: 'exact', head: true }).eq('household_id', activeHouseholdId);
      setMemberCount(count || 0);
    };
    fetchDashboard();
  }, [activeHouseholdId]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetAmount = budget?.amount || 0;
  const budgetUsedPercent = budgetAmount > 0 ? Math.min((totalExpenses / budgetAmount) * 100, 100) : 0;
  const isOverBudget = totalExpenses > budgetAmount && budgetAmount > 0;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches';
  };

  return (
    <div className="sm:ml-16 lg:ml-56 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">{greeting()}, {profile?.full_name?.split(' ')[0] || 'usuario'} 👋</h1>
        <p className="text-surface-600 mt-1">{household?.household?.name ? `Resumen de "${household.household.name}"` : 'Selecciona un hogar para comenzar'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card hover onClick={() => navigate('/tasks')} className="group">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-surface-600">Tareas pendientes</p><p className="text-2xl font-bold text-surface-900 mt-1">{tasks.length}</p></div>
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center group-hover:bg-primary-200 transition-colors"><ListTodo size={20} /></div>
          </div>
        </Card>
        <Card hover onClick={() => navigate('/pantry')} className="group">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-surface-600">Por comprar</p><p className="text-2xl font-bold text-surface-900 mt-1">{pantryItems.length}</p></div>
            <div className="w-10 h-10 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center"><ShoppingCart size={20} /></div>
          </div>
        </Card>
        <Card hover onClick={() => navigate('/expenses')} className="group">
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-surface-600">Gastos del mes</p><p className="text-2xl font-bold text-surface-900 mt-1">${totalExpenses.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</p></div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverBudget ? 'bg-danger-100 text-danger-600' : 'bg-success-100 text-success-600'}`}><Wallet size={20} /></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div><p className="text-sm text-surface-600">Miembros</p><p className="text-2xl font-bold text-surface-900 mt-1">{memberCount}</p></div>
            <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center"><Users size={20} /></div>
          </div>
        </Card>
      </div>

      {budget && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><TrendingUp size={18} className="text-surface-600" /><h3 className="font-semibold text-surface-900">Presupuesto ({budget.period_type === 'weekly' ? 'Semanal' : budget.period_type === 'biweekly' ? 'Quincenal' : 'Mensual'})</h3></div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${isOverBudget ? 'bg-danger-100 text-danger-600' : 'bg-success-100 text-success-600'}`}>{isOverBudget ? 'Excedido' : 'En presupuesto'}</span>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold text-surface-900">${totalExpenses.toLocaleString('es-MX')}</span>
            <span className="text-surface-500 mb-1">/ ${budgetAmount.toLocaleString('es-MX')}</span>
          </div>
          <div className="w-full h-3 bg-surface-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-gradient-to-r from-danger-400 to-danger-600' : 'bg-gradient-to-r from-primary-400 to-primary-600'}`} style={{ width: `${budgetUsedPercent}%` }} />
          </div>
          <p className="text-xs text-surface-500 mt-2">{budgetAmount > totalExpenses ? `Te quedan $${(budgetAmount - totalExpenses).toLocaleString('es-MX')} disponibles` : `Excedido por $${(totalExpenses - budgetAmount).toLocaleString('es-MX')}`}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900 flex items-center gap-2"><Clock size={16} className="text-primary-500" />Tareas pendientes</h3>
            <button onClick={() => navigate('/tasks')} className="text-xs text-primary-600 hover:text-primary-700 font-medium cursor-pointer">Ver todas →</button>
          </div>
          {tasks.length === 0 ? <p className="text-sm text-surface-500 text-center py-4">¡No hay tareas pendientes! 🎉</p> : (
            <div className="flex flex-col gap-2">{tasks.slice(0, 5).map((task) => (<div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors"><CheckCircle2 size={16} className="text-surface-400 shrink-0" /><span className="text-sm text-surface-800 truncate">{task.title}</span></div>))}</div>
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900 flex items-center gap-2"><ShoppingCart size={16} className="text-warning-500" />Lista de despensa</h3>
            <button onClick={() => navigate('/pantry')} className="text-xs text-primary-600 hover:text-primary-700 font-medium cursor-pointer">Ver todo →</button>
          </div>
          {pantryItems.length === 0 ? <p className="text-sm text-surface-500 text-center py-4">No hay nada pendiente por comprar 🛒</p> : (
            <div className="flex flex-col gap-2">{pantryItems.slice(0, 5).map((item) => (<div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors"><div className="w-2 h-2 rounded-full bg-warning-400 shrink-0" /><span className="text-sm text-surface-800 truncate">{item.name}</span>{item.quantity > 1 && <span className="text-xs text-surface-500 ml-auto">x{item.quantity}</span>}</div>))}</div>
          )}
        </Card>
      </div>
    </div>
  );
}
