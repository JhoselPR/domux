import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useHouseholdStore } from '@/stores/householdStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Home, Plus, UserPlus, ArrowRight, LogOut, CheckCircle2, Crown, Sun, Moon } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-100 px-4">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-surface-200 text-surface-700 hover:bg-surface-300 transition-colors cursor-pointer"
        aria-label="Cambiar tema"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25 mb-4">
            <Home className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
            ¡Bienvenido a Domux!
          </h1>
          <p className="text-surface-600 mt-1.5">
            {hasHouseholds ? 'Elige un hogar para continuar o suma uno nuevo' : 'Crea o únete a un hogar para comenzar'}
          </p>
        </div>

        {step === 'choose' && (
          <div className="flex flex-col gap-4">
            {hasHouseholds && (
              <Card className="border-primary-300 bg-surface-50 shadow-lg shadow-primary-500/10">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-surface-900">Tus hogares</h3>
                    <p className="text-sm text-surface-600 mt-1">
                      Ya perteneces a estos hogares. Entra a uno para continuar.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                    <Home size={20} />
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {households.map((membership) => {
                    const isActive = membership.household_id === activeHouseholdId;
                    const householdName = membership.household?.name || 'Hogar sin nombre';

                    return (
                      <button
                        key={membership.id}
                        type="button"
                        onClick={() => handleEnterHousehold(membership.household_id)}
                        className="group flex items-center gap-3 rounded-xl bg-surface-100 border border-surface-300 px-3 py-3 text-left hover:border-primary-300 hover:bg-surface-50 transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-surface-100 text-surface-600 flex items-center justify-center shrink-0 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                          <Home size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-surface-900 truncate">{householdName}</p>
                            {isActive && <CheckCircle2 size={14} className="text-success-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-surface-500">
                            {membership.role === 'admin' && <Crown size={12} className="text-warning-500" />}
                            <span>{membership.role === 'admin' ? 'Administrador' : 'Miembro'}</span>
                            {isActive && <span className="text-primary-600">• activo</span>}
                          </div>
                        </div>
                        <ArrowRight size={18} className="text-surface-400 group-hover:text-primary-500 transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {hasHouseholds && (
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mt-2">
                Otras opciones
              </p>
            )}

            <Card hover onClick={() => setStep('create')} className="group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                  <Plus size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-surface-900">Crear un hogar</h3>
                  <p className="text-sm text-surface-600">
                    Empieza un nuevo hogar e invita a los demás
                  </p>
                </div>
                <ArrowRight size={18} className="text-surface-400 group-hover:text-primary-500 transition-colors" />
              </div>
            </Card>

            <Card hover onClick={() => setStep('join')} className="group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center shrink-0 group-hover:bg-accent-200 transition-colors">
                  <UserPlus size={24} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-surface-900">Unirse a un hogar</h3>
                  <p className="text-sm text-surface-600">
                    Usa un código de invitación para unirte
                  </p>
                </div>
                <ArrowRight size={18} className="text-surface-400 group-hover:text-accent-500 transition-colors" />
              </div>
            </Card>

            <button
              onClick={signOut}
              className="flex items-center justify-center gap-2 mt-4 text-sm text-surface-500 hover:text-surface-700 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        )}

        {step === 'create' && (
          <Card>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-surface-900">Crear un hogar nuevo</h3>
              <Input
                label="Nombre del hogar"
                placeholder="Ej: Casa de la familia Pérez"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                icon={<Home size={16} />}
                required
              />

              {error && (
                <div className="bg-danger-50 text-danger-600 text-sm rounded-xl px-4 py-3 border border-danger-100">
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
              <h3 className="text-lg font-semibold text-surface-900">Unirse a un hogar</h3>
              <Input
                label="Código de invitación"
                placeholder="Ej: ABC12345"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="tracking-widest text-center text-lg font-mono"
                maxLength={8}
                required
              />
              <p className="text-xs text-surface-500 -mt-1">
                Pide el código de 8 caracteres al administrador del hogar.
              </p>

              {error && (
                <div className="bg-danger-50 text-danger-600 text-sm rounded-xl px-4 py-3 border border-danger-100">
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
