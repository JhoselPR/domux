import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { Mail, Lock, User, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

export function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const switchMode = () => {
    setError('');
    setSuccessMessage('');
    setSearchParams({ mode: mode === 'login' ? 'register' : 'login' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          navigate('/');
        }
      } else {
        if (!fullName.trim()) {
          setError('Por favor ingresa tu nombre completo.');
          return;
        }
        const result = await signUp(email, password, fullName);
        if (result.error) {
          setError(result.error);
        } else if (result.needsEmailConfirmation) {
          setPassword('');
          setFullName('');
          setSearchParams({ mode: 'login' });
          setSuccessMessage('Cuenta creada. Verifica tu correo electrónico y luego inicia sesión.');
        } else {
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="warm flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-raised hover:text-ink"
        aria-label="Cambiar tema"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Logo size={32} className="!text-2xl" />
          <p className="text-sm text-ink-2">Gestiona tu hogar en equipo</p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-line bg-card p-6 sm:p-8">
          <h2 className="mb-6 font-display text-2xl font-medium text-ink">
            {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={<User size={16} />}
                required
              />
            )}

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              minLength={6}
              required
            />

            {error && (
              <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger animate-slide-down" role="alert">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg bg-raised px-3 py-2 text-sm text-ink animate-slide-down" role="status">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex-grow border-t border-line"></div>
              <span className="text-sm text-ink-3">o</span>
              <div className="flex-grow border-t border-line"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              size="lg"
              onClick={() => signInWithGoogle()}
              
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuar con Google
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={switchMode}
              className="cursor-pointer rounded-sm text-sm text-ink-2 transition-colors hover:text-ink"
            >
              {mode === 'login'
                ? '¿No tienes cuenta? Regístrate'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
