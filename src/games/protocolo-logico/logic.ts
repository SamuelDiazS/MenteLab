// ───────────── Secuencias ─────────────
export type SeqSpec =
  | { kind: 'arith'; start: number; step: number }
  | { kind: 'geom'; start: number; ratio: number }
  | { kind: 'alt'; odd: { start: number; step: number }; even: { start: number; ratio: number } }
  | { kind: 'diffgrow'; start: number; d0: number; dd: number };

/** Genera los términos de una secuencia a partir de su regla. */
export function genSequence(spec: SeqSpec, length: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    switch (spec.kind) {
      case 'arith': out.push(spec.start + spec.step * i); break;
      case 'geom': out.push(spec.start * spec.ratio ** i); break;
      case 'alt':
        out.push(i % 2 === 0 ? spec.odd.start + spec.odd.step * (i / 2) : spec.even.start * spec.even.ratio ** ((i - 1) / 2));
        break;
      case 'diffgrow': out.push(i === 0 ? spec.start : out[i - 1] + spec.d0 + spec.dd * (i - 1)); break;
    }
  }
  return out;
}

// ───────────── Orden ─────────────
export type Constraint =
  | { t: 'before'; a: string; b: string }
  | { t: 'immBefore'; a: string; b: string }
  | { t: 'adjacent'; a: string; b: string }
  | { t: 'notAdjacent'; a: string; b: string }
  | { t: 'at'; a: string; i: number }
  | { t: 'notAt'; a: string; i: number }
  | { t: 'notEnd'; a: string }
  | { t: 'between'; a: string; b: string; c: string };

export function checkConstraint(order: string[], c: Constraint): boolean {
  const p = (x: string) => order.indexOf(x);
  switch (c.t) {
    case 'before': return p(c.a) < p(c.b);
    case 'immBefore': return p(c.b) - p(c.a) === 1;
    case 'adjacent': return Math.abs(p(c.a) - p(c.b)) === 1;
    case 'notAdjacent': return Math.abs(p(c.a) - p(c.b)) !== 1;
    case 'at': return p(c.a) === c.i;
    case 'notAt': return p(c.a) !== c.i;
    case 'notEnd': return p(c.a) !== 0 && p(c.a) !== order.length - 1;
    case 'between': return Math.min(p(c.b), p(c.c)) < p(c.a) && p(c.a) < Math.max(p(c.b), p(c.c));
  }
}

export const violatedConstraints = (order: string[], cs: { c: Constraint }[]): number[] =>
  cs.flatMap((x, i) => (checkConstraint(order, x.c) ? [] : [i]));

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p]));
}

export function arrangeSolutions(items: string[], cs: { c: Constraint }[]): string[][] {
  return permutations(items).filter((o) => violatedConstraints(o, cs).length === 0);
}

// ───────────── Interruptores ─────────────
/** Literal: "A" (encendido) o "!A" (apagado). */
export type Lit = string;
export type Rule =
  | { t: 'lit'; a: Lit }
  | { t: 'implies'; a: Lit; b: Lit }
  | { t: 'notBoth'; a: Lit; b: Lit }
  | { t: 'or'; lits: Lit[] }
  | { t: 'xor'; a: Lit; b: Lit }
  | { t: 'iff'; a: Lit; b: Lit }
  | { t: 'exactly'; n: number; lits: Lit[] };

export type SwitchState = Record<string, boolean>;
const lit = (s: SwitchState, l: Lit) => (l.startsWith('!') ? !s[l.slice(1)] : s[l]);

export function evalRule(s: SwitchState, r: Rule): boolean {
  switch (r.t) {
    case 'lit': return lit(s, r.a);
    case 'implies': return !lit(s, r.a) || lit(s, r.b);
    case 'notBoth': return !(lit(s, r.a) && lit(s, r.b));
    case 'or': return r.lits.some((l) => lit(s, l));
    case 'xor': return lit(s, r.a) !== lit(s, r.b);
    case 'iff': return lit(s, r.a) === lit(s, r.b);
    case 'exactly': return r.lits.filter((l) => lit(s, l)).length === r.n;
  }
}

export const violatedRules = (s: SwitchState, rules: { r: Rule }[]): number[] => rules.flatMap((x, i) => (evalRule(s, x.r) ? [] : [i]));

export function switchSolutions(vars: string[], rules: { r: Rule }[]): SwitchState[] {
  const out: SwitchState[] = [];
  for (let m = 0; m < 1 << vars.length; m++) {
    const s: SwitchState = {};
    vars.forEach((v, i) => { s[v] = Boolean((m >> i) & 1); });
    if (violatedRules(s, rules).length === 0) out.push(s);
  }
  return out;
}

// ───────────── Deducción ─────────────
export const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
export const wrongMarks = (selected: string[], correct: string[], all: string[]) => all.filter((id) => selected.includes(id) !== correct.includes(id)).length;
