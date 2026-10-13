import { describe, expect, it } from 'vitest';
import { applyHintPenalty, attemptScore, classifyScore, selectionScore, sessionAccuracy, sessionScore, sessionXp, stars } from '../utils/scoring';
import { levelFromXp, xpForLevel } from '../utils/levels';
import { currentStreak, dayKey } from '../utils/dates';
import type { ChallengeRecord } from '../types';

const rec = (score: number, timeSec = 10): ChallengeRecord => ({ challengeId: 'x', skill: 'a.b', title: 't', score, correct: score >= 60, attempts: 1, hintsUsed: 0, timeSec });

describe('puntuación', () => {
  it('attemptScore: 100 al primer intento y baja con fallos y pistas', () => {
    expect(attemptScore(1, 0, true)).toBe(100);
    expect(attemptScore(2, 0, true)).toBe(80);
    expect(attemptScore(3, 1, true)).toBe(54);
    expect(attemptScore(3, 0, false)).toBe(0);
    expect(attemptScore(3, 9, true)).toBe(10); // piso al resolver
  });
  it('selectionScore da crédito parcial y penaliza los errores', () => {
    expect(selectionScore([2], [2])).toBe(100);
    expect(selectionScore([0, 1], [0, 1])).toBe(100);
    expect(selectionScore([0], [0, 1])).toBe(50);
    expect(selectionScore([0, 3], [0, 1])).toBe(0);
    expect(selectionScore([5], [2])).toBe(0);
  });
  it('classifyScore cuenta aciertos', () => {
    expect(classifyScore({ a: 'x', b: 'y' }, { a: 'x', b: 'z' })).toBe(50);
    expect(classifyScore({}, { a: 'x' })).toBe(0);
  });
  it('applyHintPenalty no baja de 0', () => {
    expect(applyHintPenalty(100, 2)).toBe(84);
    expect(applyHintPenalty(10, 5)).toBe(0);
  });
  it('sessionScore sin velocidad es el promedio; con velocidad solo bonifica', () => {
    const rs = [rec(100, 5), rec(50, 5)];
    expect(sessionScore(rs, { speedWeight: 0, parSeconds: 60 })).toBe(75);
    const fast = sessionScore(rs, { speedWeight: 0.1, parSeconds: 60 });
    const slow = sessionScore([rec(100, 500), rec(50, 500)], { speedWeight: 0.1, parSeconds: 60 });
    expect(fast).toBeGreaterThan(75);
    expect(slow).toBe(75);
    expect(sessionScore([rec(0, 1)], { speedWeight: 0.1, parSeconds: 60 })).toBe(0); // sin precisión no hay bonificación
  });
  it('accuracy, xp y estrellas', () => {
    expect(sessionAccuracy([rec(100), rec(50)])).toBeCloseTo(0.75);
    expect(sessionXp(80, 2, 3)).toBe(26);
    expect(sessionXp(80, 2, 0)).toBe(0);
    expect(stars(95)).toBe(3); expect(stars(80)).toBe(2); expect(stars(60)).toBe(1); expect(stars(59)).toBe(0);
  });
});

describe('niveles y racha', () => {
  it('xp por nivel', () => {
    expect(xpForLevel(2)).toBe(100); expect(xpForLevel(3)).toBe(300);
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(299).level).toBe(2);
    expect(levelFromXp(300).level).toBe(3);
  });
  it('racha cuenta días consecutivos hasta hoy o ayer', () => {
    const today = new Date(2026, 9, 12);
    const d = (n: number) => dayKey(new Date(2026, 9, 12 - n));
    expect(currentStreak([], today)).toBe(0);
    expect(currentStreak([d(0), d(1), d(2)], today)).toBe(3);
    expect(currentStreak([d(1), d(2)], today)).toBe(2);
    expect(currentStreak([d(0), d(2)], today)).toBe(1);
    expect(currentStreak([d(3)], today)).toBe(0);
  });
});
