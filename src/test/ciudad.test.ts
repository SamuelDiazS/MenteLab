import { describe, expect, it } from 'vitest';
import { SOCIALES_CHALLENGES } from '../games/ciudad-en-equilibrio/data';
import { bestOptions, decisionScore, effect, findAllocation, indicatorValues, SECTORS, totalSpent, unmetGoals, INDICATORS } from '../games/ciudad-en-equilibrio/logic';

describe('Ciudad en equilibrio', () => {
  it('el efecto tiene rendimientos decrecientes', () => {
    expect(effect(0)).toBe(0);
    expect(effect(15)).toBe(50);
    expect(effect(30) - effect(15)).toBeLessThan(effect(15) - effect(0));
  });
  it('los pesos de cada indicador suman 1', () => {
    for (const c of SOCIALES_CHALLENGES) {
      if (c.kind !== 'budget') continue;
      for (const i of INDICATORS) expect(c.weights[i.id].reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    }
  });
  it('cada escenario de presupuesto es posible con 100 puntos, pero no trivial', () => {
    for (const c of SOCIALES_CHALLENGES) {
      if (c.kind !== 'budget') continue;
      const a = findAllocation(c.weights, c.goals);
      expect(a, c.id).not.toBeNull();
      expect(totalSpent(a!)).toBe(100);
      expect(unmetGoals(c.weights, c.goals, a!)).toEqual([]);
      const even = Object.fromEntries(SECTORS.map((s) => [s.id, 20])) as never;
      const allIn = { educacion: 100, salud: 0, movilidad: 0, seguridad: 0, ambiente: 0 };
      expect(unmetGoals(c.weights, c.goals, allIn).length, `${c.id} no se resuelve concentrando todo`).toBeGreaterThan(0);
      void even; void indicatorValues;
    }
  });
  it('en las decisiones, cada criterio tiene una única mejor opción y distinta entre criterios', () => {
    for (const c of SOCIALES_CHALLENGES) {
      if (c.kind !== 'decision') continue;
      const bests = c.criteria.map((k) => bestOptions(c.options, k.weights));
      for (const b of bests) expect(b, c.id).toHaveLength(1);
      expect(new Set(bests.flat()).size, c.id).toBe(c.criteria.length);
      expect(c.data.some((d) => d.supports.length === 0)).toBe(true); // hay un dato distractor
      for (const k of c.criteria) expect(c.data.some((d) => d.supports.includes(k.id))).toBe(true);
    }
  });
  it('resultados conocidos de la decisión del lote', () => {
    const c = SOCIALES_CHALLENGES.find((x) => x.id === 'so-2-decision');
    if (c?.kind !== 'decision') throw new Error('falta');
    expect(bestOptions(c.options, c.criteria[0].weights)).toEqual(['salud']);
    expect(bestOptions(c.options, c.criteria[1].weights)).toEqual(['parque']);
    expect(bestOptions(c.options, c.criteria[2].weights)).toEqual(['comercial']);
  });
  it('puntaje de decisión: 60 por coherencia + 40 por el dato', () => {
    expect(decisionScore(true, true)).toBe(100);
    expect(decisionScore(true, false)).toBe(60);
    expect(decisionScore(false, true)).toBe(40);
    expect(decisionScore(false, false)).toBe(0);
  });
});
