import { Link } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Home,
  MailPlus,
  Moon,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Sun,
  UsersRound,
} from 'lucide-react';

const featureCards = [
  {
    icon: ClipboardList,
    label: 'Tareas compartidas',
    title: 'Que la casa avance sin perseguir a nadie',
    text: 'Asigna pendientes, ordena prioridades y mantén visible qué falta hacer en el hogar.',
    accent: 'tasks',
  },
  {
    icon: PackageCheck,
    label: 'Despensa y stock',
    title: 'Compra con contexto, no con memoria',
    text: 'Registra lo que hay, detecta faltantes y evita compras duplicadas antes de salir.',
    accent: 'pantry',
  },
  {
    icon: ReceiptText,
    label: 'Gastos del hogar',
    title: 'Cuentas claras para convivir mejor',
    text: 'Centraliza gastos comunes para entender en qué se va el dinero y coordinar aportes.',
    accent: 'expenses',
  },
] as const;

const featureAccentStyles = {
  tasks: {
    icon: 'bg-tasks-100 text-tasks-600',
    label: 'text-tasks-600',
  },
  pantry: {
    icon: 'bg-pantry-100 text-pantry-600',
    label: 'text-pantry-600',
  },
  expenses: {
    icon: 'bg-expenses-100 text-expenses-600',
    label: 'text-expenses-600',
  },
} as const;

const collaborationPoints = [
  'Crea tu hogar y agrega integrantes con invitaciones.',
  'Separa responsabilidades sin perder la vista completa.',
  'Usa un espacio común para familia, pareja, compañeros de vivienda o equipos pequeños.',
];

const weeklyRhythm = [
  'Lunes: revisar tareas abiertas',
  'Miércoles: actualizar despensa',
  'Viernes: ordenar gastos comunes',
];

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50';

export function LandingPage() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <main className="min-h-screen overflow-hidden bg-transparent text-surface-900">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" className={`flex items-center gap-2 rounded-xl font-display text-2xl font-bold tracking-tight text-surface-900 ${focusRing}`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-home-500 to-tasks-500 shadow-lg shadow-home-500/20">
            <Home className="text-white" size={20} aria-hidden="true" />
          </span>
          Domux
        </Link>

        <nav aria-label="Acceso" className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-card-muted text-surface-700 transition-colors hover:bg-surface-300 hover:text-surface-900 ${focusRing}`}
            aria-label="Cambiar tema"
          >
            {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
          </button>
          <Link
            to="/auth?mode=login"
            className={`rounded-xl px-3 py-2 text-sm font-semibold text-surface-700 transition-colors hover:bg-card-muted hover:text-surface-900 sm:px-4 ${focusRing}`}
          >
            Iniciar sesión
          </Link>
          <Link
            to="/auth?mode=register"
            className={`rounded-xl bg-home-fill px-4 py-2 text-sm font-semibold text-white shadow-md shadow-home-fill/15 transition-all hover:bg-home-fill-hover hover:shadow-lg ${focusRing}`}
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-24 lg:pt-16">
        <div className="absolute -right-28 top-8 hidden h-72 w-72 rounded-full bg-pantry-100/70 blur-3xl lg:block" aria-hidden="true" />
        <div className="relative z-10 flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-border-subtle bg-card/80 px-3 py-1.5 text-sm font-semibold text-surface-700 shadow-sm backdrop-blur">
            <Sparkles className="text-pantry-500" size={16} aria-hidden="true" />
            El hogar completo, en un solo tablero
          </div>

          <h1 className="font-display text-5xl font-bold leading-[0.96] tracking-tight text-surface-900 sm:text-6xl lg:text-7xl">
            Ordena la casa sin convertirte en gerente de la casa.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-surface-600 sm:text-xl">
            Domux ayuda a familias, parejas y hogares compartidos a coordinar tareas, despensa, gastos e invitaciones en un espacio claro, cálido y pensado para convivir mejor.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/auth?mode=register"
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-home-fill px-6 py-3 text-base font-bold text-white shadow-lg shadow-home-fill/20 transition-all hover:-translate-y-0.5 hover:bg-home-fill-hover hover:shadow-xl ${focusRing}`}
            >
              Crear mi hogar en Domux
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              to="/auth?mode=login"
              className={`inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-card/75 px-6 py-3 text-base font-bold text-surface-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-home-500 hover:bg-home-50 hover:text-home-600 ${focusRing}`}
            >
              Ya tengo cuenta
            </Link>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 text-sm text-surface-600 sm:grid-cols-3">
            {['Tareas visibles', 'Stock ordenado', 'Gastos claros'].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-2xl bg-card/65 px-3 py-2 shadow-sm ring-1 ring-border-subtle/80">
                <CheckCircle2 className="text-tasks-500" size={16} aria-hidden="true" />
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 lg:pl-4">
          <div className="rounded-[2rem] border border-border-subtle bg-card/88 p-4 shadow-xl backdrop-blur sm:p-5">
            <div className="rounded-[1.5rem] border border-border-subtle bg-elevated p-4 shadow-inner sm:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-home-600">Casa Serrano</p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-surface-900">Semana bajo control</h2>
                </div>
                <div className="rounded-2xl bg-tasks-100 px-3 py-2 text-sm font-bold text-tasks-600">4 personas</div>
              </div>

              <div className="grid gap-4 py-5 sm:grid-cols-2">
                <article className="rounded-3xl bg-home-50 p-4 ring-1 ring-home-100">
                  <p className="text-sm font-bold text-home-600">Hoy</p>
                  <p className="mt-2 text-3xl font-extrabold text-surface-900">7</p>
                  <p className="text-sm text-surface-600">tareas activas</p>
                </article>
                <article className="rounded-3xl bg-pantry-50 p-4 ring-1 ring-pantry-100">
                  <p className="text-sm font-bold text-pantry-600">Despensa</p>
                  <p className="mt-2 text-3xl font-extrabold text-surface-900">12</p>
                  <p className="text-sm text-surface-600">items por reponer</p>
                </article>
              </div>

              <div className="space-y-3">
                {weeklyRhythm.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-card px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-settings-100 text-sm font-extrabold text-settings-600">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-surface-800">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl bg-surface-900 p-4 text-surface-50 shadow-lg">
                <p className="text-sm font-semibold text-surface-300">Próxima invitación</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                      <MailPlus size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-bold">Agregar a Juli</p>
                      <p className="text-sm text-surface-300">Invitación lista para enviar</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-tasks-500/20 px-3 py-1 text-sm font-bold text-tasks-500">Activo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="features-title">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-settings-600">Qué incluye</p>
          <h2 id="features-title" className="mt-3 font-display text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl">
            Una base operativa para lo que normalmente queda en conversaciones dispersas.
          </h2>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {featureCards.map(({ icon: Icon, label, title, text, accent }) => (
            <article key={title} className="rounded-[1.75rem] border border-border-subtle bg-card/82 p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl">
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${featureAccentStyles[accent].icon}`}>
                <Icon size={22} aria-hidden="true" />
              </div>
              <p className={`text-sm font-bold uppercase tracking-[0.18em] ${featureAccentStyles[accent].label}`}>{label}</p>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-surface-900">{title}</h3>
              <p className="mt-3 leading-7 text-surface-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8" aria-labelledby="collaboration-title">
        <div className="rounded-[2rem] border border-border-subtle bg-surface-900 p-7 text-surface-50 shadow-xl">
          <UsersRound className="text-pantry-500" size={34} aria-hidden="true" />
          <h2 id="collaboration-title" className="mt-5 font-display text-4xl font-bold tracking-tight">
            Pensado para hogares reales: con gente, roles y cambios.
          </h2>
          <p className="mt-4 leading-7 text-surface-300">
            Domux no intenta reemplazar la conversación. La ordena: cada integrante sabe dónde mirar, qué resolver y cómo colaborar sin depender de recordatorios eternos.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {collaborationPoints.map((point) => (
            <article key={point} className="rounded-[1.5rem] border border-border-subtle bg-card p-5 shadow-sm">
              <ShieldCheck className="mb-4 text-tasks-500" size={24} aria-hidden="true" />
              <p className="font-bold leading-7 text-surface-800">{point}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-border-subtle bg-gradient-to-br from-card to-card-muted p-7 text-center shadow-xl sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-home-600">Empieza simple</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl">
            Crea tu cuenta, configura tu hogar e invita a quienes conviven contigo.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-surface-600">
            En pocos minutos tienes un lugar compartido para organizar lo cotidiano sin que todo dependa de una sola persona.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/auth?mode=register"
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-home-fill px-6 py-3 font-bold text-white shadow-lg shadow-home-fill/20 transition-all hover:-translate-y-0.5 hover:bg-home-fill-hover ${focusRing}`}
            >
              Registrarme gratis
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              to="/auth?mode=login"
              className={`inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-elevated px-6 py-3 font-bold text-surface-800 transition-all hover:border-home-500 hover:bg-home-50 hover:text-home-600 ${focusRing}`}
            >
              Entrar a mi cuenta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
