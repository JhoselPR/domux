import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useHouseholdStore } from '@/stores/householdStore';
import { useThemeStore } from '@/stores/themeStore';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: Home, label: 'Inicio', active: 'bg-home-100 text-home-600', marker: 'bg-home-500' },
  { to: '/tasks', icon: ListTodo, label: 'Tareas', active: 'bg-tasks-100 text-tasks-600', marker: 'bg-tasks-500' },
  { to: '/pantry', icon: ShoppingCart, label: 'Despensa', active: 'bg-pantry-100 text-pantry-600', marker: 'bg-pantry-500' },
  { to: '/expenses', icon: Wallet, label: 'Gastos', active: 'bg-expenses-100 text-expenses-600', marker: 'bg-expenses-500' },
  { to: '/settings', icon: Settings, label: 'Ajustes', active: 'bg-settings-100 text-settings-600', marker: 'bg-settings-500' },
];

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
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-card/82 backdrop-blur-xl border-b border-border-subtle shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Logo + Household Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-home-50 to-tasks-100 flex items-center justify-center shadow-md shadow-home-500/20">
                {/* <Home className="text-white" size={16} /> */}
                <img src="/img/domux-iso.png" alt="Domux" className="w-full h-full" />
              </div>
              <span className="font-display text-xl font-bold text-surface-900 tracking-tight hidden sm:block">
                Domux
              </span>
            </div>

            {/* Household Selector */}
            {households.length > 0 && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setHouseholdMenuOpen(!householdMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card-muted hover:bg-surface-300 text-sm font-medium text-surface-800 transition-colors cursor-pointer border border-border-subtle"
                >
                  <span className="max-w-[120px] sm:max-w-[200px] truncate">
                    {currentHousehold?.household?.name || 'Seleccionar hogar'}
                  </span>
                  <ChevronDown size={14} className={clsx('transition-transform', householdMenuOpen && 'rotate-180')} />
                </button>

                {householdMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border-subtle rounded-2xl shadow-lg overflow-hidden animate-slide-down z-50">
                    <div className="p-2">
                      <p className="px-3 py-1.5 text-xs font-medium text-surface-500 uppercase tracking-wider">
                        Tus hogares
                      </p>
                      {households.map((member) => (
                        <button
                          key={member.household_id}
                          onClick={() => {
                            setActiveHousehold(member.household_id);
                            setHouseholdMenuOpen(false);
                          }}
                          className={clsx(
                            'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
                            'flex items-center justify-between',
                            member.household_id === activeHouseholdId
                              ? 'bg-home-50 text-home-600 font-semibold'
                              : 'text-surface-700 hover:bg-card-muted'
                          )}
                        >
                          <span className="truncate">{member.household?.name}</span>
                          {member.role === 'admin' && (
                            <span className="text-xs bg-settings-100 text-settings-600 px-2 py-0.5 rounded-full shrink-0 ml-2">
                              Admin
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-border-subtle p-2">
                      <button
                        onClick={() => {
                          setHouseholdMenuOpen(false);
                          navigate('/onboarding');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-home-600 hover:bg-home-50 transition-colors cursor-pointer font-semibold"
                      >
                        + Crear o unirse a otro hogar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-xl text-surface-600 hover:bg-card-muted transition-colors cursor-pointer"
              title="Sincronizar datos"
              aria-label="Refresh data"
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-surface-600 hover:bg-card-muted transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {profile && (
              <div className="flex items-center gap-2 ml-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-settings-500 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {profile.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl text-surface-600 hover:bg-card-muted hover:text-danger-500 transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/92 backdrop-blur-xl border-t border-border-subtle sm:hidden z-40 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ to, icon: Icon, label, active }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                    'flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all duration-200 min-w-[56px]',
                    isActive
                     ? `${active} shadow-sm shadow-home-500/10`
                     : 'text-surface-500 hover:text-surface-700'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={clsx(
                    'p-1.5 rounded-2xl transition-all duration-200',
                    isActive && 'bg-elevated/90 shadow-md ring-1 ring-white/40 dark:ring-white/10'
                  )}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden sm:flex fixed left-0 top-14 bottom-0 w-16 lg:w-56 flex-col bg-card/78 backdrop-blur-xl border-r border-border-subtle z-30">
        <nav className="flex flex-col gap-1 p-2 mt-2">
          {navItems.map(({ to, icon: Icon, label, active, marker }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                  isActive
                    ? `${active} font-semibold shadow-sm`
                    : 'text-surface-600 hover:bg-card-muted hover:text-surface-800'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className={clsx('absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full', marker)} />}
              <Icon size={20} />
              <span className="hidden lg:block text-sm">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}
