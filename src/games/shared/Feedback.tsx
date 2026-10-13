import { ArrowRight, CheckCircle2, CircleAlert, CircleDashed } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

export function Feedback({ score, explanation, onNext, last, children, nextLabel }: { score: number; explanation: string; onNext: () => void; last: boolean; children?: ReactNode; nextLabel?: string }) {
  const tone = score >= 80 ? 'good' : score >= 60 ? 'warn' : 'bad';
  const Icon = score >= 80 ? CheckCircle2 : score >= 60 ? CircleDashed : CircleAlert;
  const btn = useRef<HTMLButtonElement>(null);
  // el foco pasa al botón de continuar para quien navega con teclado o lector de pantalla
  useEffect(() => { btn.current?.focus({ preventScroll: false }); }, []);
  const label = score >= 80 ? 'Muy bien' : score >= 60 ? 'Bien, pero con matices' : 'Esta vez no salió';
  return (
    <section aria-live="polite" className={`card-pad anim-rise mt-5 border-${tone}/50`}>
      <div className="flex flex-wrap items-center gap-3">
        <Icon className={`h-6 w-6 text-${tone}`} aria-hidden="true" />
        <h3 className="text-lg font-bold">{label}</h3>
        <span className="chip ml-auto">{score} / 100</span>
      </div>
      <p className="reading mt-3 text-sm text-ink/90">{explanation}</p>
      {children}
      <div className="mt-4 flex justify-end">
        <button ref={btn} type="button" className="btn-primary" onClick={onNext}>
          {last ? 'Ver resultados' : (nextLabel ?? 'Siguiente desafío')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
