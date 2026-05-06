import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useHouseholdStore } from '@/stores/householdStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Home, Plus, UserPlus, ArrowRight, LogOut } from 'lucide-react';

export function OnboardingPage() {
  const [step, setStep] = useState<'choose' | 'create' | 'join'>('choose');
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user, signOut } = useAuthStore();
  const { createHousehold, joinHousehold } = useHouseholdStore();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-100 px-4">
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
            Crea o únete a un hogar para comenzar
          </p>
        </div>

        {step === 'choose' && (
          <div className="flex flex-col gap-4">
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
