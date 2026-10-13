import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, RotateCcw, Star, Trophy, Unlock } from 'lucide-react';
import type { Achievement, ChallengeRecord, GameMeta } from '../../types';
import { skillById } from '../../data/competencies';
import { formatDuration } from '../../utils/dates';
import { Icon } from '../../components/Icon';
import { Confetti } from '../../components/ui';
import { PASS_THRESHOLD } from '../../config';
import { stars } from '../../utils/scoring';

export interface SessionResult {
  score: number;
  accuracy: number;
  xp: number;
  durationSec: number;
  records: ChallengeRecord[];
  unlocked: Achievement[];
  levelCleared: boolean;
  difficulty: 1 | 2 | 3;
  nextUnlocked: boolean;
}

export function ResultsScreen({ game, result, onRetry, onNextLevel }: { game: GameMeta; result: SessionResult; onRetry: () => void; onNextLevel: () => void }) {
  const s = stars(result.score);
  const passed = result.score >= PASS_THRESHOLD;
  const hints = result.records.reduce((a, r) => a + r.hintsUsed, 0);
  return (
    <div className="relative">
      {passed && <Confetti colors={['rgb(255 180 84)', 'rgb(155 140 255)', 'rgb(52 209 191)', 'rgb(255 122 102)']} />}
      <div className="card-pad relative text-center">
        <p className="text-sm font-semibold text-muted">{game.name} · {game.levelNames[result.difficulty - 1]}</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{passed ? 'Misión cumplida' : 'Casi lo logras'}</h1>
        <div className="my-4 flex justify-center gap-1" role="img" aria-label={`${s} de 3 estrellas`}>
          {[1, 2, 3].map((i) => <Star key={i} className={`anim-pop h-9 w-9 ${i <= s ? 'fill-warn text-warn' : 'text-line'}`} style={{ animationDelay: `${i * 0.12}s` }} aria-hidden="true" />)}
        </div>
        <p className="font-display text-6xl font-extrabold">{result.score}<span className="text-xl text-muted"> / 100</span></p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {passed ? 'Superaste el umbral de 60 puntos.' : 'Necesitas 60 puntos para superar el nivel. Revisa las explicaciones y vuelve a intentarlo.'} Este puntaje es interno de MenteLab y no equivale a un puntaje oficial del examen.
        </p>
        <dl className="mx-auto mt-5 grid max-w-xl grid-cols-2 gap-3 text-left sm:grid-cols-4">
          {[['Experiencia', `+${result.xp} XP`], ['Aciertos', `${result.records.filter((r) => r.correct).length}/${result.records.length}`], ['Pistas', String(hints)], ['Tiempo', formatDuration(result.durationSec)]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-raised/50 p-3"><dt className="text-xs text-muted">{k}</dt><dd className="font-display text-lg font-bold">{v}</dd></div>
          ))}
        </dl>
        {result.levelCleared && result.nextUnlocked && (
          <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-xl bg-good/15 p-3 text-sm font-semibold text-good"><Unlock className="h-4 w-4" aria-hidden="true" />¡Nuevo nivel desbloqueado!</p>
        )}
        {result.unlocked.length > 0 && (
          <div className="mx-auto mt-4 max-w-md space-y-2 text-left" aria-live="polite">
            {result.unlocked.map((a) => (
              <div key={a.id} className="anim-rise flex items-center gap-3 rounded-xl border border-warn/50 bg-warn/10 p-3">
                <Icon name={a.icon} className="h-6 w-6 text-warn" />
                <div><p className="flex items-center gap-1.5 text-sm font-bold"><Trophy className="h-3.5 w-3.5" aria-hidden="true" />Logro: {a.name} {a.xp > 0 && <span className="chip">+{a.xp} XP</span>}</p><p className="text-xs text-muted">{a.description}</p></div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn-primary" onClick={onRetry}><RotateCcw className="h-4 w-4" aria-hidden="true" />Volver a intentarlo</button>
          {result.nextUnlocked && result.difficulty < 3 && <button type="button" className="btn-ghost" onClick={onNextLevel}>Siguiente nivel <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>}
          <Link to="/juegos" className="btn-ghost">Volver al hub</Link>
        </div>
      </div>

      <section className="mt-6" aria-labelledby="rev-title">
        <h2 id="rev-title" className="mb-3 text-xl font-bold">Revisión de cada desafío</h2>
        <ul className="space-y-2">
          {result.records.map((r) => (
            <li key={r.challengeId + r.timeSec}>
              <details className="card group p-4">
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  <span className={`chip ${r.score >= 80 ? '!text-good' : r.score >= PASS_THRESHOLD ? '!text-warn' : '!text-bad'}`}>{r.score} pts</span>
                  <span className="font-semibold">{r.title}</span>
                  <span className="ml-auto hidden text-xs text-muted sm:inline">{skillById(r.skill)?.label}</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="reading mt-3 text-sm text-ink/90">{r.explanation}</p>
                <p className="mt-2 text-xs text-muted">Intentos: {r.attempts} · Pistas: {r.hintsUsed} · Tiempo: {formatDuration(r.timeSec)}</p>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
