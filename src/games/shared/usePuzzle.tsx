import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { attemptScore } from '../../utils/scoring';
import { useHints } from '../../hooks/useHints';
import type { RenderCtx } from './ChallengeRunner';

export const MAX_ATTEMPTS = 3;

/**
 * Lógica común de los desafíos con varios intentos: tres verificaciones, pistas
 * progresivas y puntaje por intentos. Opcionalmente concede crédito parcial al agotar los intentos.
 */
export function usePuzzle(hintCount: number, ctx: RenderCtx, penaltyPerHint = 6) {
  void penaltyPerHint;
  const hints = useHints(hintCount);
  const [attempts, setAttempts] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState<boolean | null>(null);
  const check = (ok: boolean, failMsg: string, answer: string, partial = 0) => {
    const n = attempts + 1;
    setAttempts(n);
    if (ok) {
      setSolved(true); setMsg(null);
      ctx.resolve({ score: attemptScore(n, hints.used, true), attempts: n, hintsUsed: hints.used, answer });
    } else if (n >= MAX_ATTEMPTS) {
      setSolved(false); setMsg(null);
      ctx.resolve({ score: Math.max(0, Math.min(55, partial) - hints.used * 6), attempts: n, hintsUsed: hints.used, answer });
    } else {
      setMsg(`${failMsg} Te quedan ${MAX_ATTEMPTS - n} intento${MAX_ATTEMPTS - n === 1 ? '' : 's'}.`);
    }
  };
  return { hints, attempts, msg, solved, check };
}

export function Status({ attempts, msg, solved, okText = '¡Resuelto!', failText = 'Se agotaron los intentos. Abajo tienes la explicación.' }: { attempts: number; msg: string | null; solved: boolean | null; okText?: string; failText?: string }) {
  return (
    <div className="mt-3 min-h-[1.5rem] text-sm" aria-live="polite">
      <span className="text-muted">Intentos usados: {attempts} de {MAX_ATTEMPTS}</span>
      {msg && <p className="mt-1 flex items-start gap-1.5 font-semibold text-warn"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{msg}</p>}
      {solved === true && <p className="mt-1 font-semibold text-good">{okText}</p>}
      {solved === false && <p className="mt-1 font-semibold text-bad">{failText}</p>}
    </div>
  );
}
