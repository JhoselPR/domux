import { useEffect, useState, useCallback } from 'react';
import { useHouseholdStore } from '@/stores/householdStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, CheckCircle2, Circle, Calendar, User, Repeat, Trash2 } from 'lucide-react';
import type { Task, Profile, WeekDay } from '@/types/database';
import { clsx } from 'clsx';

const WEEKDAYS: { key: WeekDay; label: string; short: string }[] = [
  { key: 'monday', label: 'Lunes', short: 'L' },
  { key: 'tuesday', label: 'Martes', short: 'M' },
  { key: 'wednesday', label: 'Miércoles', short: 'Mi' },
  { key: 'thursday', label: 'Jueves', short: 'J' },
  { key: 'friday', label: 'Viernes', short: 'V' },
  { key: 'saturday', label: 'Sábado', short: 'S' },
  { key: 'sunday', label: 'Domingo', short: 'D' },
];

type ViewMode = 'all' | 'daily' | 'weekly';

export function TasksPage() {
  const { activeHouseholdId } = useHouseholdStore();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<WeekDay[]>([]);

  const fetchTasks = useCallback(async () => {
    if (!activeHouseholdId) return;
    const { data } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(*)')
      .eq('household_id', activeHouseholdId)
      .order('created_at', { ascending: false });
    setTasks((data as unknown as Task[]) || []);
  }, [activeHouseholdId]);

  const fetchMembers = useCallback(async () => {
    if (!activeHouseholdId) return;
    const { data } = await supabase
      .from('household_members')
      .select('profile:profiles(*)')
      .eq('household_id', activeHouseholdId);
    const profiles = (data || []).map((d: Record<string, unknown>) => d.profile as Profile).filter(Boolean);
    setMembers(profiles);
  }, [activeHouseholdId]);

  useEffect(() => { fetchTasks(); fetchMembers(); }, [fetchTasks, fetchMembers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHouseholdId || !user) return;
    setLoading(true);
    await supabase.from('tasks').insert({
      household_id: activeHouseholdId,
      title,
      status: 'pending',
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      is_recurring: isRecurring,
      recurring_days: recurringDays,
      created_by: user.id,
    });
    setTitle(''); setAssignedTo(''); setDueDate(''); setIsRecurring(false); setRecurringDays([]);
    setShowModal(false); setLoading(false);
    fetchTasks();
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    fetchTasks();
  };

  const toggleDay = (day: WeekDay) => {
    setRecurringDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  // Filtering
  const filteredTasks = tasks.filter((task) => {
    if (viewMode === 'all') return true;
    const today = new Date();
    if (viewMode === 'daily') {
      if (task.due_date) { return new Date(task.due_date).toDateString() === today.toDateString(); }
      if (task.is_recurring && task.recurring_days.length > 0) {
        const dayName = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][today.getDay()];
        return task.recurring_days.includes(dayName as WeekDay);
      }
      return false;
    }
    // weekly
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 7);
    if (task.due_date) { const d = new Date(task.due_date); return d >= startOfWeek && d < endOfWeek; }
    if (task.is_recurring) return true;
    return false;
  });

  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

  return (
    <div className="sm:ml-16 lg:ml-56 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Tareas</h1>
          <p className="text-surface-600 text-sm mt-1">Organiza las tareas del hogar</p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={<Plus size={16} />}>Nueva tarea</Button>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 p-1 bg-surface-200 rounded-xl w-fit mb-6">
        {(['all', 'daily', 'weekly'] as ViewMode[]).map((mode) => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer',
              viewMode === mode ? 'bg-surface-50 text-surface-900 shadow-sm' : 'text-surface-600 hover:text-surface-800')}>
            {mode === 'all' ? 'Todas' : mode === 'daily' ? 'Hoy' : 'Semana'}
          </button>
        ))}
      </div>

      {/* Pending */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wider mb-3">Pendientes ({pendingTasks.length})</h2>
        {pendingTasks.length === 0 ? (
          <Card><p className="text-sm text-surface-500 text-center py-4">No hay tareas pendientes 🎉</p></Card>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingTasks.map((task) => (
              <Card key={task.id} padding="sm" className="group">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleStatus(task)} className="text-surface-400 hover:text-primary-500 transition-colors cursor-pointer shrink-0">
                    <Circle size={20} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {task.assignee && <span className="inline-flex items-center gap-1 text-xs text-surface-500"><User size={12} />{task.assignee.full_name}</span>}
                      {task.due_date && <span className="inline-flex items-center gap-1 text-xs text-surface-500"><Calendar size={12} />{new Date(task.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>}
                      {task.is_recurring && <span className="inline-flex items-center gap-1 text-xs text-primary-500"><Repeat size={12} />{task.recurring_days.map((d) => WEEKDAYS.find((w) => w.key === d)?.short).join(', ')}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-danger-500 transition-all cursor-pointer"><Trash2 size={16} /></button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wider mb-3">Completadas ({completedTasks.length})</h2>
          <div className="flex flex-col gap-2">
            {completedTasks.map((task) => (
              <Card key={task.id} padding="sm" className="opacity-60">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleStatus(task)} className="text-success-500 cursor-pointer shrink-0"><CheckCircle2 size={20} /></button>
                  <p className="text-sm text-surface-700 line-through truncate flex-1">{task.title}</p>
                  <button onClick={() => deleteTask(task.id)} className="text-surface-400 hover:text-danger-500 transition-all cursor-pointer"><Trash2 size={16} /></button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva tarea">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Título" placeholder="Ej: Lavar los platos" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-700">Asignar a</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-2.5 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500">
              <option value="">Sin asignar</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <Input label="Fecha límite" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

          {/* Recurrence */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm font-medium text-surface-700">Repetir semanalmente</span>
            </label>
            {isRecurring && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {WEEKDAYS.map(({ key, short }) => (
                  <button key={key} type="button" onClick={() => toggleDay(key)}
                    className={clsx('w-9 h-9 rounded-full text-xs font-semibold transition-all cursor-pointer',
                      recurringDays.includes(key) ? 'bg-primary-600 text-white shadow-md' : 'bg-surface-200 text-surface-600 hover:bg-surface-300')}>
                    {short}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" loading={loading} fullWidth className="mt-2">Crear tarea</Button>
        </form>
      </Modal>
    </div>
  );
}
