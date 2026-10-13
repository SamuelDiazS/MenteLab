import { Link } from 'react-router-dom';
import { CheckCircle2, Play, Trophy } from 'lucide-react';
import { competencyById } from '../data/competencies';
import type { GameMeta, Progress } from '../types';
import { bestScore, gameProgressPct, gameStatus, unlockedMax } from '../utils/stats';
import { Icon } from './Icon';
import { ProgressBar } from './ui';

export const DIFF_LABEL = ['', 'Accesible', 'Media', 'Exigente'];
const STATUS_LABEL = { nuevo: 'Nuevo', 'en-progreso': 'En progreso', completado: 'Completado' } as const;

export function GameCard({ game, progress }: { game: GameMeta; progress: Progress }) {
  const comp = competencyById(game.competency);
  const st = gameStatus(progress, game.id);
  const best = bestScore(progress, game.id);
  const color = `rgb(var(--${comp.token}))`;
  return (
    <article className="card group flex flex-col overflow-hidden" style={{ borderTop: `4px solid ${color}` }}>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: `rgb(var(--${comp.token}) / .18)`, color }}><Icon name={game.icon} className="h-6 w-6" /></span>
          <div className="min-w-0">
            <h3 className="text-xl font-bold leading-tight">{game.name}</h3>
            <p className="text-sm font-semibold" style={{ color }}>{comp.name}</p>
          </div>
          <span className={`chip ml-auto shrink-0 ${st === 'completado' ? '!text-good' : ''}`}>{st === 'completado' && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}{STATUS_LABEL[st]}</span>
        </div>
        <p className="mt-3 text-sm text-ink/90">{game.mechanic}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="chip">{game.genre}</span>
          <span className="chip">Dificultad: {DIFF_LABEL[game.baseDifficulty]}</span>
          <span className="chip">Nivel disponible: {unlockedMax(progress, game.id)} de 3</span>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted"><span>Niveles superados: {(progress.cleared[game.id] ?? []).length} de 3</span>{best !== null && <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3" aria-hidden="true" />Mejor: {best}</span>}</div>
          <ProgressBar value={gameProgressPct(progress, game.id) / 100} label={`Progreso en ${game.name}`} tone={`bg-${comp.token}`} />
        </div>
      </div>
      <Link to={`/juego/${game.id}`} className="btn-primary m-5 mt-0" aria-label={`Jugar ${game.name}`}><Play className="h-4 w-4" aria-hidden="true" />Jugar</Link>
    </article>
  );
}
