import { COMPETENCIES, SKILLS } from '../data/competencies';
import { GAMES } from '../data/games';
import type { CompetencyId, Difficulty, GameId, Progress } from '../types';

export interface Aggregate {
  attempts: number;
  points: number;
  hints: number;
  timeSec: number;
}

export function aggregateByPrefix(p: Progress, prefix: string): Aggregate {
  const agg: Aggregate = { attempts: 0, points: 0, hints: 0, timeSec: 0 };
  for (const [k, v] of Object.entries(p.skillStats)) {
    if (k.startsWith(`${prefix}.`)) {
      agg.attempts += v.attempts;
      agg.points += v.points;
      agg.hints += v.hints;
      agg.timeSec += v.timeSec;
    }
  }
  return agg;
}

export const accuracyOf = (a: { attempts: number; points: number }) => (a.attempts ? a.points / a.attempts : null);

export function overallAccuracy(p: Progress): number | null {
  let attempts = 0;
  let points = 0;
  for (const v of Object.values(p.skillStats)) {
    attempts += v.attempts;
    points += v.points;
  }
  return attempts ? points / attempts : null;
}

export function competencyAccuracy(p: Progress, c: CompetencyId): number | null {
  return accuracyOf(aggregateByPrefix(p, c));
}

export const totalCompleted = (p: Progress) => Object.values(p.gameStats).reduce((a, g) => a + g.completed, 0);
export const totalStarted = (p: Progress) => Object.values(p.gameStats).reduce((a, g) => a + g.started, 0);
export const totalAbandoned = (p: Progress) => Object.values(p.gameStats).reduce((a, g) => a + g.abandoned, 0);

/** Máxima dificultad disponible: se abre la siguiente al superar la anterior. */
export function unlockedMax(p: Progress, game: GameId): Difficulty {
  const c = p.cleared[game] ?? [];
  if (c.includes(1) && c.includes(2)) return 3;
  if (c.includes(1)) return 2;
  return 1;
}

export const isGameCompleted = (p: Progress, game: GameId) => {
  const c = p.cleared[game] ?? [];
  return c.includes(1) && c.includes(2) && c.includes(3);
};

export const bestScore = (p: Progress, game: GameId): number | null => {
  const vals = ([1, 2, 3] as Difficulty[]).map((d) => p.best[`${game}:${d}`]).filter((v) => typeof v === 'number');
  return vals.length ? Math.max(...vals) : null;
};

export type GameStatus = 'nuevo' | 'en-progreso' | 'completado';
export const gameStatus = (p: Progress, game: GameId): GameStatus => {
  if (isGameCompleted(p, game)) return 'completado';
  const g = p.gameStats[game];
  return g && g.started > 0 ? 'en-progreso' : 'nuevo';
};

export const gameProgressPct = (p: Progress, game: GameId) => ((p.cleared[game] ?? []).length / 3) * 100;

export interface Diagnosis {
  competency: CompetencyId;
  accuracy: number;
  attempts: number;
  level: 'fortaleza' | 'intermedio' | 'por-mejorar';
}

export const MIN_DIAGNOSIS_ATTEMPTS = 6;

export function diagnosis(p: Progress): Diagnosis[] {
  const out: Diagnosis[] = [];
  for (const c of COMPETENCIES) {
    const agg = aggregateByPrefix(p, c.id);
    if (agg.attempts >= MIN_DIAGNOSIS_ATTEMPTS) {
      const accuracy = agg.points / agg.attempts;
      out.push({ competency: c.id, accuracy, attempts: agg.attempts, level: accuracy >= 0.8 ? 'fortaleza' : accuracy < 0.6 ? 'por-mejorar' : 'intermedio' });
    }
  }
  return out;
}

export function skillBreakdown(p: Progress, game: GameId) {
  return SKILLS.filter((s) => s.game === game).map((s) => {
    const st = p.skillStats[s.id];
    return { skill: s, attempts: st?.attempts ?? 0, accuracy: st && st.attempts ? st.points / st.attempts : null };
  });
}

export const gameName = (id: string) => GAMES.find((g) => g.id === id)?.name ?? id;
