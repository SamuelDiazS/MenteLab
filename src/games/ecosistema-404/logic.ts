export interface DesignGroup { id: string; values: Record<string, string | number> }

/** Variables en las que difieren dos grupos de un experimento. */
export function differingVars(a: DesignGroup, b: DesignGroup): string[] {
  return Object.keys(a.values).filter((k) => a.values[k] !== b.values[k]);
}

/** Una comparación es válida si los grupos difieren SOLO en la variable que se quiere estudiar. */
export function isValidComparison(a: DesignGroup, b: DesignGroup, variable: string): boolean {
  const d = differingVars(a, b);
  return d.length === 1 && d[0] === variable;
}

export function validPairs(groups: DesignGroup[], variable: string): [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) if (isValidComparison(groups[i], groups[j], variable)) out.push([groups[i].id, groups[j].id]);
  return out;
}

/** Puntaje de un experimento simulado: meta alcanzada en la ejecución n (máx. 5) + predicción. */
export function simScore(goalRun: number | null, predictionOk: boolean, hints: number): number {
  const goal = goalRun === null ? 0 : Math.max(40, 75 - 10 * Math.max(0, goalRun - 2));
  const pred = predictionOk ? (goalRun === null ? 20 : 25) : 0;
  return Math.max(0, Math.min(100, goal + pred - 6 * hints));
}
export const MAX_RUNS = 5;
