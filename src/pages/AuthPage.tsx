import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Home, Mail, Lock, User, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
        } else {
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-100 px-4">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-xl bg-surface-200 text-surface-700 hover:bg-surface-300 transition-colors cursor-pointer"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25 mb-4">
            <Home className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">
            Domux
          </h1>
          <p className="text-surface-600 mt-1.5">
            Gestiona tu hogar en equipo
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-50 rounded-2xl border border-surface-300 shadow-lg p-8">
          <h2 className="text-xl font-semibold text-surface-900 mb-6">
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
              <div className="bg-danger-50 text-danger-600 text-sm rounded-xl px-4 py-3 border border-danger-100 animate-slide-down">
                {error}
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
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-surface-200"></div>
              <span className="flex-shrink-0 mx-4 text-surface-500 text-sm">o</span>
              <div className="flex-grow border-t border-surface-200"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              size="lg"
              onClick={() => signInWithGoogle()}
              className="flex items-center justify-center gap-3 bg-surface-50 hover:bg-surface-100 text-surface-800"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer"
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
