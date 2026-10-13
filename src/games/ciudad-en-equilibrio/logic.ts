export const SECTORS = [
  { id: 'educacion', label: 'Educación' },
  { id: 'salud', label: 'Salud' },
  { id: 'movilidad', label: 'Movilidad' },
  { id: 'seguridad', label: 'Seguridad y convivencia' },
  { id: 'ambiente', label: 'Ambiente y espacio público' },
] as const;
export const INDICATORS = [
  { id: 'bienestar', label: 'Bienestar' },
  { id: 'acceso', label: 'Acceso a servicios' },
  { id: 'equidad', label: 'Equidad' },
  { id: 'convivencia', label: 'Convivencia' },
  { id: 'sostenibilidad', label: 'Sostenibilidad' },
] as const;
export type SectorId = (typeof SECTORS)[number]['id'];
export type IndicatorId = (typeof INDICATORS)[number]['id'];
export type Allocation = Record<SectorId, number>;
/** Peso de cada sector (en orden de SECTORS) en cada indicador; cada fila suma 1. */
export type Weights = Record<IndicatorId, number[]>;
export type Goals = Partial<Record<IndicatorId, number>>;

/** Rendimientos decrecientes: cada punto adicional aporta menos que el anterior. */
export const effect = (points: number) => (100 * points) / (points + 15);

export function indicatorValues(w: Weights, a: Allocation): Record<IndicatorId, number> {
  const out = {} as Record<IndicatorId, number>;
  for (const ind of INDICATORS) out[ind.id] = SECTORS.reduce((acc, s, i) => acc + w[ind.id][i] * effect(a[s.id]), 0);
  return out;
}
export const totalSpent = (a: Allocation) => SECTORS.reduce((acc, s) => acc + a[s.id], 0);

export function unmetGoals(w: Weights, goals: Goals, a: Allocation): IndicatorId[] {
  const v = indicatorValues(w, a);
  return (Object.keys(goals) as IndicatorId[]).filter((k) => v[k] < (goals[k] ?? 0));
}

/** Busca (en pasos de 5) una asignación que cumpla las metas; sirve para validar y para el ejemplo. */
export function findAllocation(w: Weights, goals: Goals, step = 5): Allocation | null {
  const n = 100 / step;
  for (let a = 0; a <= n; a++) for (let b = 0; a + b <= n; b++) for (let c = 0; a + b + c <= n; c++) for (let d = 0; a + b + c + d <= n; d++) {
    const e = n - a - b - c - d;
    const alloc: Allocation = { educacion: a * step, salud: b * step, movilidad: c * step, seguridad: d * step, ambiente: e * step };
    if (unmetGoals(w, goals, alloc).length === 0) return alloc;
  }
  return null;
}

// ── Decisiones con criterios explícitos ──
export type Effects = Record<'bienestar' | 'equidad' | 'presupuesto' | 'sostenibilidad', number>;
export const scoreOption = (effects: Effects, weights: Partial<Effects>) => (Object.keys(weights) as (keyof Effects)[]).reduce((a, k) => a + (weights[k] ?? 0) * effects[k], 0);
export function bestOptions(options: { id: string; effects: Effects }[], weights: Partial<Effects>): string[] {
  const scores = options.map((o) => ({ id: o.id, s: scoreOption(o.effects, weights) }));
  const max = Math.max(...scores.map((x) => x.s));
  return scores.filter((x) => Math.abs(x.s - max) < 1e-9).map((x) => x.id);
}

/** Puntaje del razonamiento: 60 por coherencia opción–criterio, 40 por citar un dato pertinente. */
export function decisionScore(optionIsBest: boolean, datumSupports: boolean): number {
  return (optionIsBest ? 60 : 0) + (datumSupports ? 40 : 0);
}
