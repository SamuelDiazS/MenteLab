import { describe, expect, it } from 'vitest';
import { SKILLS } from '../data/competencies';
import { GAMES } from '../data/games';
import { ACHIEVEMENTS } from '../data/achievements';
import { CIENCIAS_CHALLENGES } from '../games/ecosistema-404/data';
import { flatten, LECTURA_CHALLENGES } from '../games/entre-lineas/data';
import { scoreInference, scoreSelect } from '../games/entre-lineas/logic';
import { LOGICA_CHALLENGES } from '../games/protocolo-logico/data';
import { MAT_CHALLENGES } from '../games/laboratorio-numerico/data';
import { SOCIALES_CHALLENGES } from '../games/ciudad-en-equilibrio/data';
import { CHAPTERS } from '../games/context-quest/data';
import { REGISTRY } from '../games/registry';
import { pickChallenges } from '../utils/pick';

const POOLS = [
  ['entre-lineas', LECTURA_CHALLENGES], ['protocolo-logico', LOGICA_CHALLENGES], ['laboratorio-numerico', MAT_CHALLENGES],
  ['ecosistema-404', CIENCIAS_CHALLENGES], ['ciudad-en-equilibrio', SOCIALES_CHALLENGES],
] as const;

describe('integridad del contenido', () => {
  it('hay un módulo registrado para cada juego del catálogo', () => {
    for (const g of GAMES) expect(REGISTRY[g.id]?.meta.id).toBe(g.id);
  });
  it('identificadores únicos, explicación y habilidad existente', () => {
    const ids = new Set<string>();
    const skillIds = new Set(SKILLS.map((s) => s.id));
    for (const [game, pool] of POOLS) {
      for (const c of pool) {
        expect(ids.has(c.id), `id repetido ${c.id}`).toBe(false);
        ids.add(c.id);
        expect(c.explanation.length, c.id).toBeGreaterThan(80);
        expect(skillIds.has(c.skill), `${c.id}: ${c.skill}`).toBe(true);
        expect(SKILLS.find((s) => s.id === c.skill)?.game, c.id).toBe(game);
        expect('hints' in c ? c.hints.length : 1, c.id).toBeGreaterThanOrEqual(2);
      }
    }
  });
  it('cada juego tiene al menos 3 desafíos por nivel y varios tipos', () => {
    for (const [game, pool] of POOLS) {
      for (const d of [1, 2, 3] as const) expect(pool.filter((c) => c.difficulty === d).length, `${game} nivel ${d}`).toBeGreaterThanOrEqual(3);
      expect(new Set(pool.map((c) => c.kind)).size, game).toBeGreaterThanOrEqual(3);
    }
  });
  it('Entre líneas: índices de oraciones válidos y puntajes de lectura', () => {
    for (const c of LECTURA_CHALLENGES) {
      if (c.kind === 'classify') {
        const cats = c.categories.map((x) => x.id);
        expect(c.items.every((i) => cats.includes(i.answer)), c.id).toBe(true);
      } else {
        const n = flatten(c.text).length;
        const idx = c.kind === 'select' ? c.correct : c.evidence;
        expect(idx.every((i) => i >= 0 && i < n), c.id).toBe(true);
        if (c.kind === 'select') expect(c.correct.length).toBeLessThanOrEqual(c.maxSelect);
        else expect(c.options.some((o) => o.id === c.correctOption)).toBe(true);
      }
    }
    expect(scoreSelect([2], [2])).toBe(100);
    const inf = LECTURA_CHALLENGES.find((c) => c.kind === 'inference');
    if (inf?.kind !== 'inference') throw new Error('falta');
    expect(scoreInference(inf, inf.correctOption, inf.evidence[0])).toBe(100);
    expect(scoreInference(inf, inf.correctOption, 99)).toBe(60);
    expect(scoreInference(inf, 'zzz', inf.evidence[0])).toBe(40);
  });
  it('clasificaciones de ciencias y sociales: respuestas dentro de las categorías', () => {
    for (const c of [...CIENCIAS_CHALLENGES, ...SOCIALES_CHALLENGES]) {
      if (c.kind !== 'classify') continue;
      const cats = c.categories.map((x) => x.id);
      expect(c.items.every((i) => cats.includes(i.answer)), c.id).toBe(true);
      expect(new Set(c.items.map((i) => i.answer)).size, `${c.id} usa varias categorías`).toBeGreaterThan(1);
    }
  });
  it('Context Quest: grafo de escenas consistente y alcanzable', () => {
    for (const ch of CHAPTERS) {
      const byId = new Map(ch.scenes.map((s) => [s.id, s]));
      expect(byId.has(ch.start)).toBe(true);
      const seen = new Set<string>();
      const stack = [ch.start];
      while (stack.length) {
        const id = stack.pop()!;
        if (seen.has(id)) continue;
        seen.add(id);
        const s = byId.get(id);
        expect(s, `${ch.title}: ${id}`).toBeDefined();
        expect(s!.options.filter((o) => o.correct)).toHaveLength(1);
        expect(s!.explanation.length).toBeGreaterThan(40);
        for (const o of s!.options) { expect(o.consequence.length).toBeGreaterThan(10); if (o.next) stack.push(o.next); }
      }
      expect(seen.size, `${ch.title} escenas inalcanzables`).toBe(ch.scenes.length);
      // el camino correcto termina el capítulo
      let cur = byId.get(ch.start)!;
      let steps = 0;
      while (steps++ < 20) { const ok = cur.options.find((o) => o.correct)!; if (!ok.next) break; cur = byId.get(ok.next)!; }
      expect(steps).toBeLessThan(20);
      expect(steps).toBeGreaterThanOrEqual(3);
    }
    expect(CHAPTERS.map((c) => c.difficulty)).toEqual([1, 2, 3]);
  });
  it('logros con identificadores únicos', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
  it('pickChallenges: nivel completo y refuerzo por habilidad', () => {
    const lvl2 = pickChallenges(LECTURA_CHALLENGES, 2, undefined, 2);
    expect(lvl2.every((c) => c.difficulty === 2)).toBe(true);
    const focus = pickChallenges(LECTURA_CHALLENGES, 1, 'lectura.tesis', 2);
    expect(focus.length).toBeGreaterThanOrEqual(2);
    expect(focus.filter((c) => c.skill === 'lectura.tesis').length).toBeGreaterThanOrEqual(2);
    expect(focus.every((c) => c.difficulty <= 2)).toBe(true);
    const noDeep = pickChallenges(LECTURA_CHALLENGES, 1, 'lectura.supuestos', 1);
    expect(noDeep.length).toBeGreaterThanOrEqual(2); // se completa con el nivel actual
  });
});
