import { COMPETENCIES, skillById } from '../data/competencies';
import { GAMES } from '../data/games';
import type { Difficulty, GameId, Progress, SkillId } from '../types';
import { aggregateByPrefix, gameStatus, totalCompleted, unlockedMax } from './stats';

export interface Recommendation {
  kind: 'refuerzo' | 'avanzar' | 'explorar';
  gameId: GameId;
  difficulty: Difficulty;
  focusSkill?: SkillId;
  title: string;
  reason: string;
  /** Valor usado para ordenar (mayor = más prioritario); visible para que el algoritmo sea transparente */
  priority: number;
}

export const MIN_SESSIONS_FOR_PROFILE = 3;
export const MIN_SKILL_ATTEMPTS = 2;

/** Precisión ponderada: 60 % de los últimos resultados y 40 % del histórico. */
export function weightedAccuracy(stat: { attempts: number; points: number; recent: number[] }): number {
  const overall = stat.points / stat.attempts;
  if (stat.recent.length === 0) return overall;
  const last = stat.recent.slice(-5);
  const recent = last.reduce((a, b) => a + b, 0) / last.length;
  return 0.6 * recent + 0.4 * overall;
}

export type RecommendationResult =
  | { status: 'insufficient'; completed: number; needed: number; message: string }
  | { status: 'ok'; items: Recommendation[] };

/**
 * Algoritmo local y transparente:
 * 1. Refuerzo: habilidades con ≥2 intentos, ordenadas por (1 − precisión ponderada) + 0.1 por pista usada por intento.
 * 2. Avanzar: juegos con un nivel siguiente abierto y sin superar.
 * 3. Explorar: competencias sin ningún intento todavía.
 */
export function recommend(p: Progress): RecommendationResult {
  const completed = totalCompleted(p);
  if (completed < MIN_SESSIONS_FOR_PROFILE) {
    return {
      status: 'insufficient',
      completed,
      needed: MIN_SESSIONS_FOR_PROFILE,
      message: `Aún no hay datos suficientes para recomendarte con criterio. Completa ${MIN_SESSIONS_FOR_PROFILE - completed} partida${MIN_SESSIONS_FOR_PROFILE - completed === 1 ? '' : 's'} más (de cualquier juego) y verás tu perfil.`,
    };
  }
  const items: Recommendation[] = [];

  for (const [id, st] of Object.entries(p.skillStats)) {
    const skill = skillById(id);
    if (!skill || st.attempts < MIN_SKILL_ATTEMPTS) continue;
    const acc = weightedAccuracy(st);
    const hintRate = st.hints / st.attempts;
    const priority = 1 - acc + 0.1 * Math.min(hintRate, 3);
    if (acc < 0.8) {
      items.push({
        kind: 'refuerzo',
        gameId: skill.game,
        difficulty: unlockedMax(p, skill.game),
        focusSkill: id,
        title: `Refuerza: ${skill.label}`,
        reason: `Tu precisión en esta habilidad es ${Math.round(acc * 100)} % (${st.attempts} intentos${hintRate > 0 ? `, ${hintRate.toFixed(1)} pistas por intento` : ''}). Te recomendamos ${skill.practice}.`,
        priority,
      });
    }
  }

  for (const g of GAMES) {
    const max = unlockedMax(p, g.id);
    const cleared = p.cleared[g.id] ?? [];
    if (!cleared.includes(max) && gameStatus(p, g.id) !== 'nuevo') {
      items.push({
        kind: 'avanzar',
        gameId: g.id,
        difficulty: max,
        title: `Avanza en ${g.name}`,
        reason: `Tienes disponible el nivel «${g.levelNames[max - 1]}» y aún no lo superas.`,
        priority: 0.35,
      });
    }
  }

  for (const c of COMPETENCIES) {
    if (aggregateByPrefix(p, c.id).attempts === 0) {
      const g = GAMES.find((x) => x.competency === c.id)!;
      items.push({
        kind: 'explorar',
        gameId: g.id,
        difficulty: 1,
        title: `Explora ${g.name}`,
        reason: `Todavía no has entrenado ${c.name.toLowerCase()}; una primera partida permitirá incluirla en tu perfil.`,
        priority: 0.3,
      });
    }
  }

  items.sort((a, b) => b.priority - a.priority);
  return { status: 'ok', items: items.slice(0, 5) };
}
