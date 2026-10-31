import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  ListTodo,
  ShoppingCart,
  Wallet,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useHouseholdStore } from '@/stores/householdStore';
import { useThemeStore } from '@/stores/themeStore';
import { Avatar } from '@/components/ui/Avatar';
import { Logo, LogoMark } from '@/components/ui/Logo';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/tasks', icon: ListTodo, label: 'Tareas' },
  { to: '/pantry', icon: ShoppingCart, label: 'Despensa' },
  { to: '/expenses', icon: Wallet, label: 'Gastos' },
  { to: '/settings', icon: Settings, label: 'Ajustes' },
];

const iconButton = 'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-raised hover:text-ink';

export function AppLayout() {
  const { profile, signOut } = useAuthStore();
  const { households, activeHouseholdId, setActiveHousehold, activeHousehold } = useHouseholdStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [householdMenuOpen, setHouseholdMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentHousehold = activeHousehold();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHouseholdMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-page">
      {/* Desktop Sidebar Navigation */}
      <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-16 flex-col border-r border-line bg-page sm:flex lg:w-60">
        <Link to="/" className="flex h-14 items-center justify-center px-4 lg:justify-start" aria-label="Domux">
          <LogoMark className="lg:hidden" />
          <span className="hidden lg:block"><Logo /></span>
        </Link>
        <nav className="flex flex-col gap-1 px-3 pt-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-label={label}
              className={({ isActive }) =>
                clsx(
                  'flex h-9 items-center justify-center gap-2 rounded-lg px-2 text-sm transition-colors lg:justify-start',
                  isActive ? 'bg-raised font-medium text-ink' : 'text-ink-2 hover:bg-raised hover:text-ink'
                )
              }
            >
              <Icon size={18} />
              <span className="hidden lg:block">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-col sm:pl-16 lg:pl-60">
        {/* Top Header */}
        <header className="sticky top-0 z-40 border-b border-line bg-page">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: Household Selector */}
            <div className="flex min-w-0 items-center gap-3">
              <LogoMark className="sm:hidden" />

              {households.length > 0 && (
                <div className="relative min-w-0" ref={menuRef}>
                  <button
                    onClick={() => setHouseholdMenuOpen(!householdMenuOpen)}
                    aria-expanded={householdMenuOpen}
                    className="-ml-2 flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm font-medium text-ink transition-colors hover:bg-raised"
                  >
                    <span className="max-w-[120px] truncate sm:max-w-[200px]">
                      {currentHousehold?.household?.name || 'Seleccionar hogar'}
                    </span>
                    <ChevronDown size={16} className={clsx('text-ink-3 transition-transform', householdMenuOpen && 'rotate-180')} />
                  </button>

                  {householdMenuOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-card shadow-[0_8px_24px_rgba(0,0,0,0.1)] animate-slide-down">
                      <div className="p-1">
                        <p className="px-3 pb-1 pt-2 text-xs text-ink-3">Tus hogares</p>
                        {households.map((member) => (
                          <button
                            key={member.household_id}
                            onClick={() => {
                              setActiveHousehold(member.household_id);
                              setHouseholdMenuOpen(false);
                            }}
                            className={clsx(
                              'flex h-9 w-full cursor-pointer items-center justify-between rounded-lg px-3 text-left text-sm transition-colors',
                              member.household_id === activeHouseholdId
                                ? 'bg-raised font-medium text-ink'
                                : 'text-ink-2 hover:bg-raised hover:text-ink'
                            )}
                          >
                            <span className="truncate">{member.household?.name}</span>
                            {member.role === 'admin' && <span className="ml-2 shrink-0 text-xs font-normal text-ink-3">Admin</span>}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-line p-1">
                        <button
                          onClick={() => {
                            setHouseholdMenuOpen(false);
                            navigate('/onboarding');
                          }}
                          className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-sm text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                        >
                          <Plus size={16} />
                          Crear o unirse a otro hogar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              <button onClick={() => window.location.reload()} className={iconButton} title="Sincronizar datos" aria-label="Sincronizar datos">
                <RefreshCw size={18} />
              </button>

              <button onClick={toggleTheme} className={iconButton} aria-label="Cambiar tema">
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              <button onClick={handleSignOut} className={iconButton} aria-label="Cerrar sesión">
                <LogOut size={18} />
              </button>

              {profile && (
                <div className="ml-2">
                  <Avatar name={profile.full_name} />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8 sm:px-6 sm:pb-12 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-page sm:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1 transition-colors',
                  isActive ? 'text-accent' : 'text-ink-3 hover:text-ink'
                )
              }
            >
              <Icon size={18} />
              <span className="text-[11px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
