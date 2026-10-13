import { HINT_PENALTY, PASS_THRESHOLD } from '../config';
import type { ChallengeRecord, GameMeta } from '../types';

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Resta la penalización moderada por pistas en desafíos de una sola entrega. */
export function applyHintPenalty(score: number, hints: number, perHint = HINT_PENALTY): number {
  return clamp(Math.round(score - hints * perHint), 0, 100);
}

/**
 * Puntaje de un desafío con varios intentos (rompecabezas): 100 al primer intento,
 * -20 por cada fallo previo, -6 por pista, con un piso de 10 si se resolvió.
 */
export function attemptScore(attempts: number, hints: number, solved: boolean): number {
  if (!solved) return 0;
  return clamp(100 - 20 * Math.max(0, attempts - 1) - 6 * hints, 10, 100);
}

/** Crédito parcial para selecciones: aciertos menos errores, sobre el total de correctas. */
export function selectionScore(selected: number[], correct: number[]): number {
  const hits = selected.filter((s) => correct.includes(s)).length;
  const wrong = selected.length - hits;
  if (correct.length === 0) return selected.length === 0 ? 100 : 0;
  return Math.round(clamp((hits - wrong) / correct.length, 0, 1) * 100);
}

/** Crédito para clasificaciones: fracción de elementos bien clasificados. */
export function classifyScore(answers: Record<string, string>, solution: Record<string, string>): number {
  const ids = Object.keys(solution);
  if (ids.length === 0) return 100;
  const ok = ids.filter((id) => answers[id] === solution[id]).length;
  return Math.round((ok / ids.length) * 100);
}

export const isCorrect = (score: number) => score >= PASS_THRESHOLD;

/**
 * Puntaje de una partida (0-100): promedio de los desafíos. Solo los juegos con
 * speedWeight > 0 añaden una bonificación por rapidez, proporcional a la precisión.
 */
export function sessionScore(records: ChallengeRecord[], game: Pick<GameMeta, 'speedWeight' | 'parSeconds'>): number {
  if (records.length === 0) return 0;
  const base = records.reduce((a, r) => a + r.score, 0) / records.length;
  if (game.speedWeight <= 0) return Math.round(base);
  const avgTime = records.reduce((a, r) => a + r.timeSec, 0) / records.length;
  const speed = clamp(1 - avgTime / (game.parSeconds * 2), 0, 1);
  // bonificación de hasta speedWeight·base, solo si hay precisión que premiar
  return Math.round(clamp(base + game.speedWeight * speed * base, 0, 100));
}

export function sessionAccuracy(records: ChallengeRecord[]): number {
  if (records.length === 0) return 0;
  return records.reduce((a, r) => a + r.score, 0) / (records.length * 100);
}

/** Experiencia ganada: proporcional al puntaje, con bonos por dificultad y por completar. */
export function sessionXp(score: number, difficulty: 1 | 2 | 3, completed: number): number {
  if (completed === 0) return 0;
  return Math.round(score / 10 * difficulty + 10);
}

export function stars(score: number): 0 | 1 | 2 | 3 {
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  if (score >= PASS_THRESHOLD) return 1;
  return 0;
}
