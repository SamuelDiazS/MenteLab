import { describe, expect, it } from 'vitest';
import { FERIA_OPT, HUERTA_OPT, MAT_CHALLENGES } from '../games/laboratorio-numerico/data';
import { bestBudget, budgetCost, extremeInterval, fenceArea, linear, maxFenceArea, passesThrough, quad, ratioOk, twoDraws, unmetMinimums, urnProbability, type BudgetItem } from '../games/laboratorio-numerico/logic';

/** Fuerza bruta independiente para validar la programación dinámica. */
function brute(items: BudgetItem[], budget: number): number {
  let best = -1;
  const rec = (i: number, cost: number, value: number) => {
    if (cost > budget) return;
    if (i === items.length) { best = Math.max(best, value); return; }
    for (let q = items[i].min; q <= items[i].max; q++) rec(i + 1, cost + q * items[i].price, value + q * items[i].value);
  };
  rec(0, 0, 0);
  return best;
}

describe('Laboratorio numérico', () => {
  it('razones: la mezcla 6 : 9 : 15 cumple 2 : 3 : 5 con total 30', () => {
    expect(ratioOk([6, 9, 15], [2, 3, 5], 30)).toBe(true);
    expect(ratioOk([6, 9, 14], [2, 3, 5], 30)).toBe(false);
    expect(ratioOk([10, 10, 10], [2, 3, 5], 30)).toBe(false);
  });
  it('el óptimo del presupuesto coincide con la fuerza bruta', () => {
    for (const c of MAT_CHALLENGES) {
      if (c.kind !== 'budget') continue;
      expect(bestBudget(c.items, c.budget), c.id).toBe(brute(c.items, c.budget));
    }
    expect(HUERTA_OPT).toBeGreaterThan(0);
    expect(FERIA_OPT).toBeGreaterThan(0);
  });
  it('los mínimos y el costo se calculan bien', () => {
    const c = MAT_CHALLENGES.find((x) => x.id === 'mt-3-budget');
    if (c?.kind !== 'budget') throw new Error('falta');
    const q = { micro: 2, panel: 1 };
    expect(budgetCost(c.items, q)).toBe(48);
    expect(unmetMinimums(c.items, { micro: 1, panel: 0 }).map((i) => i.id)).toEqual(['micro', 'panel']);
  });
  it('intervalos: mayor aumento y mayor descenso', () => {
    expect(extremeInterval([20, 22, 26, 35, 36, 36, 33], 'rise')).toBe(2);
    expect(extremeInterval([20, 22, 26, 35, 36, 36, 33], 'fall')).toBe(5);
  });
  it('funciones: soluciones conocidas', () => {
    const lin = MAT_CHALLENGES.find((x) => x.id === 'mt-2-linear');
    const qua = MAT_CHALLENGES.find((x) => x.id === 'mt-3-quad');
    if (lin?.kind !== 'function' || qua?.kind !== 'function') throw new Error('falta');
    expect(passesThrough(linear(2, 3), lin.targets)).toBe(true);
    expect(passesThrough(linear(2, 4), lin.targets)).toBe(false);
    expect(passesThrough(quad(0.25, 4, 1), qua.targets)).toBe(true);
    // la solución es única en la rejilla de los controles
    let n = 0;
    for (let a = 0.25; a <= 2; a += 0.25) for (let h = 0; h <= 8; h++) for (let k = 0; k <= 6; k++) if (passesThrough(quad(a, h, k), qua.targets)) n++;
    expect(n).toBe(1);
    n = 0;
    for (let m = 0; m <= 5; m += 0.5) for (let b = 0; b <= 10; b++) if (passesThrough(linear(m, b), lin.targets)) n++;
    expect(n).toBe(1);
  });
  it('probabilidad', () => {
    expect(urnProbability(2, 3)).toBeCloseTo(0.4);
    const t = twoDraws(3, 2);
    expect(t.rr).toBeCloseTo(0.3); expect(t.bb).toBeCloseTo(0.1); expect(t.mixed).toBeCloseTo(0.6);
    expect(t.rr + t.bb + t.mixed).toBeCloseTo(1);
    const u = MAT_CHALLENGES.find((x) => x.id === 'mt-2-prob');
    if (u?.kind !== 'probability') throw new Error('falta');
    const best = [...u.urns!].sort((a, b) => urnProbability(b.red, b.blue) - urnProbability(a.red, a.blue))[0];
    expect(best.id).toBe('B');
  });
  it('geometría: el corral junto al muro se maximiza con w = 7 (98 m²)', () => {
    expect(fenceArea(28, 'wall', 7)).toBe(98);
    expect(maxFenceArea(28, 'wall')).toBe(98);
    expect(fenceArea(24, 'rect', 4)).toBe(32);
    expect(maxFenceArea(24, 'rect')).toBe(36);
  });
});
