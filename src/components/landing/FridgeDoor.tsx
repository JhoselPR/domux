import { BellRing } from 'lucide-react';

const weeklyList = [
  { day: 'Lunes', text: 'Revisar tareas abiertas', done: true },
  { day: 'Miércoles', text: 'Actualizar despensa', done: true },
  { day: 'Viernes', text: 'Ordenar gastos comunes', done: false },
];

const sharedExpenses = [
  { label: 'Súper', amount: '$1,284.50' },
  { label: 'Luz', amount: '$640.00' },
  { label: 'Internet', amount: '$599.00' },
];

function Magnet({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute h-6 w-6 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_2px_3px_rgba(20,16,12,0.35)] ${className}`}
    />
  );
}

/* The same week as a real household would pin it: list, reminder and receipt on the fridge. */
export function FridgeDoor() {
  return (
    <div
      role="img"
      aria-label="Puerta de un refrigerador con la lista de la semana de Casa Serrano, un aviso y el ticket de gastos comunes"
      className="relative mx-auto h-[600px] w-full max-w-[520px] overflow-hidden rounded-t-[28px] bg-gradient-to-b from-[#b84d30] to-[#a03f25] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] sm:h-[640px]"
    >
      {/* Freezer seam */}
      <div className="flex h-20 items-center border-b border-black/25 px-8 shadow-[0_1px_0_rgba(255,255,255,0.14)]">
        <span className="font-display text-lg font-medium text-[#f6e6d8]/80">Domux</span>
      </div>

      {/* Handle */}
      <div className="absolute left-4 top-28 hidden h-48 w-3 rounded-full bg-gradient-to-r from-[#d8d6d2] to-[#9d9a95] shadow-[0_2px_4px_rgba(20,16,12,0.35)] sm:block" />

      {/* Weekly note */}
      <div className="absolute left-4 right-4 top-28 -rotate-1 bg-paper px-5 pb-6 pt-8 text-paper-ink shadow-[0_8px_16px_rgba(20,16,12,0.28)] sm:left-12 sm:right-24">
        <Magnet className="left-1/2 top-2 -translate-x-1/2 bg-[#2a2520]" />
        <p className="text-xs text-paper-ink-2">Casa Serrano · 4 personas</p>
        <p className="mt-1 font-display text-2xl font-medium">Esta semana</p>
        <ul className="mt-4 divide-y divide-paper-line text-sm">
          {weeklyList.map(({ day, text, done }) => (
            <li key={day} className="flex h-10 items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-paper-ink-2">{day}</span>
              <span className={done ? 'struck [--color-accent:#b4472a]' : ''}>{text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between text-xs text-paper-ink-2">
          <span>7 tareas activas</span>
          <span>12 por reponer</span>
        </p>
      </div>

      {/* Reminder */}
      <div className="absolute left-12 top-[456px] hidden w-44 rotate-2 bg-[#e8c872] p-4 text-paper-ink shadow-[0_6px_12px_rgba(20,16,12,0.25)] sm:block">
        <BellRing size={16} />
        <p className="mt-2 text-sm font-medium leading-5">Viernes: ordenar gastos comunes</p>
      </div>

      {/* Receipt */}
      <div className="ticket-shadow absolute right-4 top-[404px] w-52 rotate-[1.5deg] sm:right-8 sm:top-[420px] sm:w-56">
        <div className="ticket px-4 pb-6 pt-4 font-mono text-xs leading-5">
          <p className="mb-2 font-medium">Gastos comunes</p>
          <div className="border-t border-dashed border-paper-line py-2">
            {sharedExpenses.map(({ label, amount }) => (
              <div key={label} className="flex justify-between gap-4">
                <span>{label}</span>
                <span className="tabular-nums">{amount}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-4 border-t border-dashed border-paper-line pt-2 font-medium">
            <span>Total</span>
            <span className="tabular-nums">$2,523.50</span>
          </div>
        </div>
      </div>
    </div>
  );
}
