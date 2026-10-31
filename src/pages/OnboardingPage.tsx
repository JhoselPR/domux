import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useHouseholdStore } from '@/stores/householdStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LogoMark } from '@/components/ui/Logo';
import { Home, Plus, UserPlus, ArrowRight, LogOut, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

export function OnboardingPage() {
  const [step, setStep] = useState<'choose' | 'create' | 'join'>('choose');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, signOut } = useAuthStore();
  const { createHousehold, joinHousehold, households, activeHouseholdId, setActiveHousehold } = useHouseholdStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const hasHouseholds = households.length > 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    const result = await createHousehold(householdName, user.id);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    const result = await joinHousehold(inviteCode, user.id);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleEnterHousehold = (householdId: string) => {
    setActiveHousehold(householdId);
    navigate('/');
  };

  return (
    <div className="warm flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        aria-label="Cambiar tema"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark size={32} />
          <h1 className="font-display text-3xl font-medium text-ink">Tu hogar en Domux</h1>
          <p className="text-sm text-ink-2">
            {hasHouseholds ? 'Elige un hogar para continuar o suma uno nuevo' : 'Crea o únete a un hogar para comenzar'}
          </p>
        </div>

        {step === 'choose' && (
          <div className="flex flex-col gap-4">
            {hasHouseholds && (
              <Card padding="none">
                <p className="px-4 pb-2 pt-4 text-sm font-medium text-ink-2">Tus hogares</p>
                <div className="max-h-72 divide-y divide-line overflow-y-auto">
                  {households.map((membership) => {
                    const isActive = membership.household_id === activeHouseholdId;
                    const householdName = membership.household?.name || 'Hogar sin nombre';

                    return (
                      <button
                        key={membership.id}
                        type="button"
                        onClick={() => handleEnterHousehold(membership.household_id)}
                        className="group flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors last:rounded-b-xl hover:bg-raised"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{householdName}</p>
                          <p className="mt-0.5 text-xs text-ink-3">
                            {membership.role === 'admin' ? 'Administrador' : 'Miembro'}
                            {isActive && ' · activo'}
                          </p>
                        </div>
                        <ArrowRight size={16} className="shrink-0 text-ink-3 transition-colors group-hover:text-ink" />
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {hasHouseholds && <p className="mt-2 text-sm text-ink-3">Otras opciones</p>}

            <Card hover onClick={() => setStep('create')} padding="sm" className="group">
              <div className="flex items-center gap-3">
                <Plus size={18} className="shrink-0 text-ink-3" />
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-sm font-medium text-ink">Crear un hogar</h3>
                  <p className="text-sm text-ink-2">Empieza un nuevo hogar e invita a los demás</p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-ink-3 transition-colors group-hover:text-ink" />
              </div>
            </Card>

            <Card hover onClick={() => setStep('join')} padding="sm" className="group">
              <div className="flex items-center gap-3">
                <UserPlus size={18} className="shrink-0 text-ink-3" />
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-sm font-medium text-ink">Unirse a un hogar</h3>
                  <p className="text-sm text-ink-2">Usa un código de invitación para unirte</p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-ink-3 transition-colors group-hover:text-ink" />
              </div>
            </Card>

            <button
              onClick={signOut}
              className="mt-4 flex cursor-pointer items-center justify-center gap-2 text-sm text-ink-3 transition-colors hover:text-ink"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        )}

        {step === 'create' && (
          <Card>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <h3 className="text-base font-medium text-ink">Crear un hogar nuevo</h3>
              <Input
                label="Nombre del hogar"
                placeholder="Ej: Casa de la familia Pérez"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                icon={<Home size={16} />}
                required
              />

              {error && (
                <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setStep('choose'); setError(''); }}
                  className="flex-1"
                >
                  Atrás
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Crear hogar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {step === 'join' && (
          <Card>
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <h3 className="text-base font-medium text-ink">Unirse a un hogar</h3>
              <Input
                label="Código de invitación"
                placeholder="Ej: ABC12345"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="text-center font-mono text-base tracking-[0.2em]"
                maxLength={8}
                required
              />
              <p className="-mt-2 text-xs text-ink-3">
                Pide el código de 8 caracteres al administrador del hogar.
              </p>

              {error && (
                <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setStep('choose'); setError(''); }}
                  className="flex-1"
                >
                  Atrás
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Unirme
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
