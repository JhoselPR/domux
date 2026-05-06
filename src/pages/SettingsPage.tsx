import { useEffect, useState, useCallback } from 'react';
import { useHouseholdStore } from '@/stores/householdStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Copy, Check, Trash2, UserMinus, Shield, Users, Share2 } from 'lucide-react';
import type { HouseholdMember, Profile } from '@/types/database';

export function SettingsPage() {
  const { activeHouseholdId, activeHousehold, removeMember, deleteHousehold, fetchHouseholds } = useHouseholdStore();
  const { user, profile } = useAuthStore();
  const [members, setMembers] = useState<(HouseholdMember & { profile: Profile })[]>([]);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const household = activeHousehold();
  const isAdmin = household?.role === 'admin';
  const inviteCode = household?.household?.invite_code || '';

  const fetchMembers = useCallback(async () => {
    if (!activeHouseholdId) return;
    const { data } = await supabase.from('household_members')
      .select('*, profile:profiles(*)').eq('household_id', activeHouseholdId);
    setMembers((data as unknown as (HouseholdMember & { profile: Profile })[]) || []);
  }, [activeHouseholdId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/join/${inviteCode}`;
    if (navigator.share) {
      await navigator.share({ title: 'Únete a mi hogar en Domux', text: `Usa este código: ${inviteCode}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeHouseholdId) return;
    setLoading(true);
    await removeMember(memberId, activeHouseholdId);
    fetchMembers();
    setLoading(false);
  };

  const handleDeleteHousehold = async () => {
    if (!activeHouseholdId || !user) return;
    setLoading(true);
    await deleteHousehold(activeHouseholdId);
    await fetchHouseholds(user.id);
    setConfirmDelete(false);
    setLoading(false);
  };

  return (
    <div className="sm:ml-16 lg:ml-56 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Ajustes</h1>
        <p className="text-surface-600 text-sm mt-1">Configuración del hogar</p>
      </div>

      {/* Invite Code */}
      <Card className="mb-4">
        <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
          <Share2 size={16} className="text-primary-500" />
          Código de invitación
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-surface-200 rounded-xl px-4 py-3 font-mono text-lg tracking-[0.3em] text-center text-surface-900 font-bold select-all">
            {inviteCode}
          </div>
          <Button variant="secondary" onClick={copyCode} icon={copied ? <Check size={16} /> : <Copy size={16} />}>
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
        <Button variant="ghost" onClick={shareLink} fullWidth className="mt-3" icon={<Share2 size={16} />}>
          Compartir enlace de invitación
        </Button>
      </Card>

      {/* Members */}
      <Card className="mb-4">
        <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
          <Users size={16} className="text-accent-500" />
          Miembros ({members.length})
        </h3>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.profile_id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-100 group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {m.profile?.full_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">
                  {m.profile?.full_name}
                  {m.profile_id === user?.id && <span className="text-xs text-surface-500 ml-1">(tú)</span>}
                </p>
              </div>
              {m.role === 'admin' && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                  <Shield size={10} /> Admin
                </span>
              )}
              {isAdmin && m.profile_id !== user?.id && (
                <button onClick={() => handleRemoveMember(m.profile_id)}
                  className="opacity-0 group-hover:opacity-100 text-surface-400 hover:text-danger-500 transition-all cursor-pointer" title="Remover miembro">
                  <UserMinus size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      {isAdmin && (
        <Card className="border-danger-200">
          <h3 className="font-semibold text-danger-600 mb-2">Zona de peligro</h3>
          <p className="text-sm text-surface-600 mb-4">Eliminar este hogar borrará todos los datos asociados de forma permanente.</p>
          <Button variant="danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={16} />}>
            Eliminar hogar
          </Button>
        </Card>
      )}

      {/* Profile Info */}
      <Card className="mt-4">
        <h3 className="font-semibold text-surface-900 mb-3">Tu perfil</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white text-lg font-semibold">
            {profile?.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-surface-900">{profile?.full_name}</p>
            <p className="text-sm text-surface-500">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation */}
      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="¿Eliminar hogar?" size="sm">
        <p className="text-sm text-surface-600 mb-4">Esta acción no se puede deshacer. Se eliminarán todas las tareas, gastos y datos del hogar.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} fullWidth>Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteHousehold} loading={loading} fullWidth>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
