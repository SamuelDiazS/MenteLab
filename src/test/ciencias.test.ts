import { describe, expect, it } from 'vitest';
import { CIENCIAS_CHALLENGES } from '../games/ecosistema-404/data';
import { differingVars, isValidComparison, simScore, validPairs } from '../games/ecosistema-404/logic';
import { FOX_GOAL, foxSim, FOX_SEASONS, lakeSim, MODELS, rampTime, reactionTime } from '../games/ecosistema-404/models';

const defaults = (id: keyof typeof MODELS) => Object.fromEntries(MODELS[id].params.map((p) => [p.id, p.def]));
function solutions(id: keyof typeof MODELS) {
  const [a, b] = MODELS[id].params;
  const out: [number, number][] = [];
  for (let x = a.min; x <= a.max; x += a.step) for (let y = b.min; y <= b.max; y += b.step) if (MODELS[id].run({ [a.id]: x, [b.id]: y }).goalMet) out.push([x, y]);
  return out;
}

describe('Ecosistema 404', () => {
  it('los modelos son deterministas', () => {
    for (const id of Object.keys(MODELS) as (keyof typeof MODELS)[]) {
      expect(JSON.stringify(MODELS[id].run(defaults(id)))).toBe(JSON.stringify(MODELS[id].run(defaults(id))));
    }
  });
  it('rampa: la masa no cambia el tiempo y el ángulo sí', () => {
    const m = MODELS.ramp;
    expect(m.run({ angle: 30, mass: 1 }).metrics[1].value).toBe(m.run({ angle: 30, mass: 5 }).metrics[1].value);
    expect(rampTime(40)).toBeLessThan(rampTime(20));
    expect(rampTime(30)).toBeCloseTo(1.278, 2);
    expect(solutions('ramp').every(([angle]) => angle >= 35)).toBe(true);
    expect(solutions('ramp').length).toBeGreaterThan(0);
  });
  it('laguna: más fertilizante baja el oxígeno final; hay soluciones y no son triviales', () => {
    expect(lakeSim(4, 0).oxy[7]).toBeLessThan(lakeSim(1, 0).oxy[7]);
    const s = solutions('lake');
    expect(s.length).toBeGreaterThan(0);
    expect(s.length).toBeLessThan(10);
    expect(s.every(([fert]) => fert >= 2)).toBe(true);
    expect(MODELS.lake.run({ fert: 0, aer: 2 }).goalMet).toBe(false); // sin fertilizante no se cumple la condición de la finca
    expect(MODELS.lake.run({ fert: 2, aer: 0 }).goalMet).toBe(false);
  });
  it('zorros: los refugios reducen los zorros a largo plazo y hay soluciones sin refugio', () => {
    expect(foxSim(4, 0.5).foxes[FOX_SEASONS]).toBeLessThan(foxSim(4, 0).foxes[FOX_SEASONS]);
    const s = solutions('foxes');
    expect(s.length).toBeGreaterThan(0);
    expect(s.every(([, refuge]) => refuge === 0)).toBe(true);
    expect(s.map(([f]) => f)).toEqual([2, 3, 4, 5, 6]);
    const r = foxSim(4, 0);
    expect(r.rabbits[FOX_SEASONS]).toBeGreaterThanOrEqual(FOX_GOAL.rabbits);
  });
  it('reacción: más superficie y temperatura reducen el tiempo; soluciones respetan el límite de seguridad', () => {
    expect(reactionTime(20, 1)).toBe(160);
    expect(reactionTime(40, 2)).toBe(20);
    expect(reactionTime(30, 4)).toBe(20);
    const s = solutions('reaction');
    expect(s.length).toBeGreaterThan(0);
    expect(s.every(([t]) => t <= 40)).toBe(true);
  });
  it('las hipótesis marcadas como correctas coinciden con el modelo', () => {
    const base = (id: keyof typeof MODELS, p: Record<string, number>, q: Record<string, number>) => [MODELS[id].run(p), MODELS[id].run(q)];
    const [m1, m2] = base('ramp', { angle: 30, mass: 1 }, { angle: 30, mass: 2 });
    expect(m1.metrics[1].value).toBe(m2.metrics[1].value);
    expect(lakeSim(3, 0).oxy[7]).toBeLessThan(lakeSim(1, 0).oxy[7]);
    expect(reactionTime(30, 2)).toBeLessThan(reactionTime(30, 1));
    for (const c of CIENCIAS_CHALLENGES) if (c.kind === 'sim') expect(c.prediction.options.some((o) => o.id === c.prediction.correct)).toBe(true);
  });
  it('diseño experimental: solo una variable difiere', () => {
    for (const c of CIENCIAS_CHALLENGES) {
      if (c.kind !== 'design') continue;
      expect(validPairs(c.groups, c.variable).length, c.id).toBeGreaterThan(0);
    }
    const c1 = CIENCIAS_CHALLENGES.find((x) => x.id === 'ci-2-diseno');
    if (c1?.kind !== 'design') throw new Error('falta');
    expect(validPairs(c1.groups, 'sal')).toEqual([['G1', 'G2']]);
    expect(differingVars(c1.groups[0], c1.groups[3])).toEqual(['sal', 'estufa']);
    expect(isValidComparison(c1.groups[1], c1.groups[2], 'sal')).toBe(false);
    const c2 = CIENCIAS_CHALLENGES.find((x) => x.id === 'ci-3-diseno');
    if (c2?.kind !== 'design') throw new Error('falta');
    expect(validPairs(c2.groups, 'trozo')).toEqual([['G1', 'G2'], ['G1', 'G5'], ['G2', 'G5']]);
  });
  it('puntaje de simulación', () => {
    expect(simScore(1, true, 0)).toBe(100);
    expect(simScore(2, true, 0)).toBe(100);
    expect(simScore(4, true, 0)).toBe(80);
    expect(simScore(5, false, 0)).toBe(45);
    expect(simScore(null, true, 0)).toBe(20);
    expect(simScore(null, false, 3)).toBe(0);
  });
});
