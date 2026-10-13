import type { Difficulty, SkillId } from '../types';

export interface HasLevel {
  id: string;
  difficulty: Difficulty;
  skill: SkillId;
}

/**
 * Selecciona los desafíos de una partida.
 * - Modo nivel: todos los desafíos de esa dificultad, en el orden definido.
 * - Modo refuerzo: hasta 4 desafíos de la habilidad, de dificultad ≤ la desbloqueada
 *   (si hay menos de 2, se completa con el nivel actual).
 */
export function pickChallenges<T extends HasLevel>(pool: T[], difficulty: Difficulty, focusSkill: SkillId | undefined, unlockedMax: Difficulty): T[] {
  const level = pool.filter((c) => c.difficulty === difficulty);
  if (!focusSkill) return level;
  const focused = pool.filter((c) => c.skill === focusSkill && c.difficulty <= unlockedMax).sort((a, b) => a.difficulty - b.difficulty).slice(0, 4);
  if (focused.length >= 2) return focused;
  const extra = level.filter((c) => !focused.includes(c));
  return [...focused, ...extra].slice(0, 4);
}
