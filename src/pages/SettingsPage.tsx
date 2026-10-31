import { useEffect, useState, useCallback } from 'react';
import { useHouseholdStore } from '@/stores/householdStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, SectionTitle } from '@/components/ui/PageHeader';
import { Copy, Check, Trash2, UserMinus, Share2 } from 'lucide-react';
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

  useEffect(() => {
    const load = async () => {
      await fetchMembers();
    };

    void load();
  }, [fetchMembers]);

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
    <div className="animate-fade-in">
      <PageHeader title="Ajustes" subtitle="Configuración del hogar" />

      <div className="flex max-w-2xl flex-col gap-4">
        {/* Invite Code */}
        <Card>
          <h3 className="mb-3 text-sm font-medium text-ink-2">Código de invitación</h3>
          <div className="flex items-center gap-2">
            <div className="flex h-10 min-w-0 flex-1 select-all items-center justify-center rounded-lg bg-raised px-3 font-mono text-base font-medium tracking-[0.2em] text-ink">
              {inviteCode}
            </div>
            <Button variant="outline" onClick={copyCode} icon={copied ? <Check size={16} /> : <Copy size={16} />}>
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <Button variant="ghost" onClick={shareLink} fullWidth className="mt-2" icon={<Share2 size={16} />}>
            Compartir enlace de invitación
          </Button>
        </Card>

        {/* Members */}
        <Card padding="none">
          <div className="px-5 pt-5"><SectionTitle count={members.length}>Miembros</SectionTitle></div>
          <div className="divide-y divide-line">
            {members.map((m) => (
              <div key={m.profile_id} className="group flex min-h-14 items-center gap-3 px-5 py-2">
                <Avatar name={m.profile?.full_name} />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {m.profile?.full_name}
                  {m.profile_id === user?.id && <span className="ml-1 text-xs font-normal text-ink-3">(tú)</span>}
                </p>
                {m.role === 'admin' && <span className="text-xs text-ink-3">Admin</span>}
                {isAdmin && m.profile_id !== user?.id && (
                  <button onClick={() => handleRemoveMember(m.profile_id)}
                    className="cursor-pointer text-ink-3 transition-[color,opacity] hover:text-danger focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0" title="Remover miembro" aria-label="Remover miembro">
                    <UserMinus size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Danger Zone */}
        {isAdmin && (
          <Card>
            <h3 className="mb-1 text-sm font-medium text-danger">Zona de peligro</h3>
            <p className="mb-4 text-sm text-ink-2">Eliminar este hogar borrará todos los datos asociados de forma permanente.</p>
            <Button variant="danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={16} />}>
              Eliminar hogar
            </Button>
          </Card>
        )}

        {/* Profile Info */}
        <Card>
          <h3 className="mb-3 text-sm font-medium text-ink-2">Tu perfil</h3>
          <div className="flex items-center gap-3">
            <Avatar name={profile?.full_name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{profile?.full_name}</p>
              <p className="truncate text-sm text-ink-3">{user?.email}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="¿Eliminar hogar?" size="sm">
        <p className="mb-4 text-sm text-ink-2">Esta acción no se puede deshacer. Se eliminarán todas las tareas, gastos y datos del hogar.</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} fullWidth>Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteHousehold} loading={loading} fullWidth>Eliminar</Button>
        </div>
      </Modal>
    </div>
  );
}
