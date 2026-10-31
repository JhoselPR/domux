import { Link } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import { Check, Moon, Sun } from 'lucide-react';
import { FridgeDoor } from '@/components/landing/FridgeDoor';
import { Logo } from '@/components/ui/Logo';

const features = [
  {
    label: 'Tareas compartidas',
    title: 'Que la casa avance sin perseguir a nadie',
    text: 'Asigna pendientes, ordena prioridades y mantén visible qué falta hacer en el hogar. Si algo necesita atención, llega un aviso.',
  },
  {
    label: 'Despensa y stock',
    title: 'Compra con contexto, no con memoria',
    text: 'Registra lo que hay, detecta faltantes y evita compras duplicadas antes de salir.',
  },
  {
    label: 'Gastos del hogar',
    title: 'Cuentas claras para convivir mejor',
    text: 'Centraliza gastos comunes para entender en qué se va el dinero y coordinar aportes.',
  },
];

const collaborationPoints = [
  'Crea tu hogar y agrega integrantes con invitaciones',
  'Separa responsabilidades sin perder la vista completa',
  'Un espacio común para familia, pareja, compañeros de vivienda o equipos pequeños',
];

const primaryAction = 'inline-flex h-12 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-on-primary transition-[background-color,transform] hover:bg-primary-hover active:scale-[0.98]';
const secondaryAction = 'inline-flex h-12 items-center justify-center rounded-lg border border-line-strong px-5 text-sm font-medium text-ink transition-[background-color,transform] hover:bg-raised active:scale-[0.98]';

export function LandingPage() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <main className="warm min-h-screen overflow-hidden">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Acceso" className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-raised hover:text-ink"
            aria-label="Cambiar tema"
          >
            {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
          </button>
          <Link to="/auth?mode=login" className="hidden h-9 items-center rounded-lg px-3 text-sm text-ink-2 transition-colors hover:text-ink sm:flex">
            Iniciar sesión
          </Link>
          <Link
            to="/auth?mode=register"
            className="inline-flex h-9 items-center whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      <section className="border-b border-line">
        <div className="mx-auto grid w-full max-w-6xl items-end gap-12 px-4 pt-12 sm:px-6 lg:min-h-[calc(100vh-64px)] lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-8">
          <div className="animate-slide-up lg:self-center lg:pb-16">
            <h1 className="font-display text-[44px] font-medium leading-[1.05] tracking-[-0.02em] text-ink sm:text-6xl lg:text-[68px] lg:tracking-[-0.03em]">
              Ordena la casa sin convertirte en gerente de la casa
            </h1>

            <p className="mt-6 max-w-[36rem] text-lg leading-7 text-ink-2">
              Domux reparte tareas, despensa y gastos entre quienes viven contigo: familias, parejas y hogares compartidos.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth?mode=register" className={primaryAction}>
                Crear mi hogar en Domux
              </Link>
              <Link to="/auth?mode=login" className={secondaryAction}>
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <FridgeDoor />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="features-title">
        <h2 id="features-title" className="max-w-3xl font-display text-3xl font-medium leading-tight tracking-[-0.02em] text-ink sm:text-[44px]">
          Lo que hoy se pierde en conversaciones dispersas, en un solo lugar
        </h2>

        <div className="mt-12 divide-y divide-line border-y border-line">
          {features.map(({ label, title, text }) => (
            <article key={title} className="grid gap-2 py-8 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
              <p className="text-sm text-ink-3 lg:pt-1">{label}</p>
              <h3 className="font-display text-2xl font-medium leading-snug text-ink">{title}</h3>
              <p className="text-base leading-7 text-ink-2">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-28" aria-labelledby="collaboration-title">
        <div>
          <h2 id="collaboration-title" className="font-display text-3xl font-medium leading-tight tracking-[-0.02em] text-ink sm:text-[44px]">
            Pensado para hogares reales: con gente, roles y cambios
          </h2>
          <p className="mt-4 max-w-[36rem] text-base leading-7 text-ink-2">
            Domux no intenta reemplazar la conversación. La ordena: cada integrante sabe dónde mirar, qué resolver y cómo colaborar sin depender de recordatorios eternos.
          </p>
        </div>

        <ul className="divide-y divide-line lg:self-end">
          {collaborationPoints.map((point) => (
            <li key={point} className="flex gap-3 py-4 text-base leading-7 text-ink">
              <Check size={18} className="mt-1 shrink-0 text-ink-3" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <div className="rounded-2xl bg-raised p-6 sm:p-12">
          <h2 className="max-w-3xl font-display text-3xl font-medium leading-tight tracking-[-0.02em] text-ink sm:text-[44px]">
            Crea tu cuenta, configura tu hogar e invita a quienes conviven contigo
          </h2>
          <p className="mt-4 max-w-[36rem] text-base leading-7 text-ink-2">
            Un lugar compartido para organizar lo cotidiano sin que todo dependa de una sola persona.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth?mode=register" className={primaryAction}>
              Crear cuenta
            </Link>
            <Link to="/auth?mode=login" className={secondaryAction}>
              Entrar a mi cuenta
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 border-t border-line px-4 py-8 text-sm text-ink-3 sm:px-6 lg:px-8">
        <p>© 2026 Domux</p>
        <a className="rounded-sm text-ink-2 transition-colors hover:text-ink" href="mailto:felix.jhosel@gmail.com">
          Contacto
        </a>
      </footer>
    </main>
  );
}
