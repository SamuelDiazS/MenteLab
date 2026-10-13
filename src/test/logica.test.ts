import { describe, expect, it } from 'vitest';
import { LOGICA_CHALLENGES } from '../games/protocolo-logico/data';
import { arrangeSolutions, checkConstraint, genSequence, sameSet, switchSolutions, violatedConstraints, wrongMarks } from '../games/protocolo-logico/logic';

describe('Protocolo lógico', () => {
  it('genera secuencias a partir de su regla', () => {
    expect(genSequence({ kind: 'arith', start: 4, step: 5 }, 6)).toEqual([4, 9, 14, 19, 24, 29]);
    expect(genSequence({ kind: 'geom', start: 2, ratio: 3 }, 4)).toEqual([2, 6, 18, 54]);
    expect(genSequence({ kind: 'alt', odd: { start: 2, step: 2 }, even: { start: 3, ratio: 2 } }, 8)).toEqual([2, 3, 4, 6, 6, 12, 8, 24]);
    expect(genSequence({ kind: 'diffgrow', start: 1, d0: 2, dd: 2 }, 7)).toEqual([1, 3, 7, 13, 21, 31, 43]);
  });
  it('cada secuencia del contenido tiene respuestas enteras y huecos válidos', () => {
    for (const c of LOGICA_CHALLENGES.filter((x) => x.kind === 'sequence')) {
      if (c.kind !== 'sequence') continue;
      const t = genSequence(c.spec, c.length);
      expect(t.every(Number.isInteger)).toBe(true);
      expect(c.hide.every((i) => i > 0 && i < c.length)).toBe(true);
    }
  });
  it('los rompecabezas de orden tienen solución única', () => {
    for (const c of LOGICA_CHALLENGES) {
      if (c.kind !== 'arrange') continue;
      expect(arrangeSolutions(c.items.map((i) => i.id), c.clues), c.id).toHaveLength(1);
    }
  });
  it('orden: la solución conocida de la carrera es C, D, A, B', () => {
    const c = LOGICA_CHALLENGES.find((x) => x.id === 'lg-1-arr');
    if (c?.kind !== 'arrange') throw new Error('falta');
    expect(arrangeSolutions(c.items.map((i) => i.id), c.clues)[0]).toEqual(['C', 'D', 'A', 'B']);
    expect(violatedConstraints(['A', 'B', 'C', 'D'], c.clues).length).toBeGreaterThan(0);
  });
  it('restricciones individuales', () => {
    const o = ['a', 'b', 'c', 'd'];
    expect(checkConstraint(o, { t: 'before', a: 'a', b: 'c' })).toBe(true);
    expect(checkConstraint(o, { t: 'immBefore', a: 'a', b: 'c' })).toBe(false);
    expect(checkConstraint(o, { t: 'notEnd', a: 'b' })).toBe(true);
    expect(checkConstraint(o, { t: 'between', a: 'b', b: 'a', c: 'd' })).toBe(true);
    expect(checkConstraint(o, { t: 'adjacent', a: 'a', b: 'b' })).toBe(true);
    expect(checkConstraint(o, { t: 'notAdjacent', a: 'a', b: 'c' })).toBe(true);
  });
  it('los paneles de interruptores tienen solución única', () => {
    for (const c of LOGICA_CHALLENGES) {
      if (c.kind !== 'switches') continue;
      expect(switchSolutions(c.vars.map((v) => v.id), c.rules), c.id).toHaveLength(1);
    }
  });
  it('deducción: conjuntos y marcas incorrectas', () => {
    expect(sameSet(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameSet(['a'], ['a', 'b'])).toBe(false);
    expect(wrongMarks(['a', 'c'], ['a', 'b'], ['a', 'b', 'c', 'd'])).toBe(2);
  });
  it('las opciones correctas existen en cada desafío de deducción', () => {
    for (const c of LOGICA_CHALLENGES) {
      if (c.kind !== 'deduce') continue;
      expect(c.correct.every((id) => c.options.some((o) => o.id === id))).toBe(true);
    }
  });
});
