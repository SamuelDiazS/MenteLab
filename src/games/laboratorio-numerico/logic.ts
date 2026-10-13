export const round = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

// ── Proporciones ──
/** Las cantidades cumplen la razón (a:b:c…) y suman el total. */
export function ratioOk(counts: number[], ratios: number[], total: number): boolean {
  if (counts.reduce((a, b) => a + b, 0) !== total) return false;
  return counts.every((c, i) => c * ratios[0] === counts[0] * ratios[i]);
}

// ── Presupuesto ──
export interface BudgetItem { id: string; name: string; price: number; value: number; min: number; max: number }

export const budgetCost = (items: BudgetItem[], q: Record<string, number>) => items.reduce((a, i) => a + i.price * (q[i.id] ?? 0), 0);
export const budgetValue = (items: BudgetItem[], q: Record<string, number>) => items.reduce((a, i) => a + i.value * (q[i.id] ?? 0), 0);
export const unmetMinimums = (items: BudgetItem[], q: Record<string, number>) => items.filter((i) => (q[i.id] ?? 0) < i.min);

/** Valor máximo alcanzable sin pasar el presupuesto y cumpliendo mínimos (mochila acotada exacta). */
export function bestBudget(items: BudgetItem[], budget: number): number {
  const base = items.reduce((a, i) => a + i.price * i.min, 0);
  if (base > budget) return -1;
  const baseValue = items.reduce((a, i) => a + i.value * i.min, 0);
  const cap = budget - base;
  let dp = Array<number>(cap + 1).fill(0);
  for (const it of items) {
    const next = dp.slice();
    for (let w = 0; w <= cap; w++) {
      for (let k = 1; k <= it.max - it.min && k * it.price <= w; k++) {
        next[w] = Math.max(next[w], dp[w - k * it.price] + k * it.value);
      }
    }
    dp = next;
  }
  return baseValue + dp[cap];
}

// ── Gráficas ──
/** Índice i del intervalo [i, i+1] con mayor aumento (rise) o mayor descenso (fall). */
export function extremeInterval(data: number[], kind: 'rise' | 'fall'): number {
  let best = 0;
  for (let i = 1; i < data.length - 1; i++) {
    const d = data[i + 1] - data[i];
    const b = data[best + 1] - data[best];
    if (kind === 'rise' ? d > b : d < b) best = i;
  }
  return best;
}

// ── Funciones ──
export const linear = (m: number, b: number) => (x: number) => m * x + b;
export const quad = (a: number, h: number, k: number) => (x: number) => a * (x - h) ** 2 + k;
export const passesThrough = (f: (x: number) => number, pts: [number, number][]) => pts.every(([x, y]) => Math.abs(f(x) - y) < 1e-9);

// ── Probabilidad ──
export const urnProbability = (red: number, blue: number) => red / (red + blue);

/** Probabilidades al extraer dos bolas sin reemplazo. */
export function twoDraws(red: number, blue: number) {
  const n = red + blue;
  const rr = (red / n) * ((red - 1) / (n - 1));
  const bb = (blue / n) * ((blue - 1) / (n - 1));
  return { rr, bb, mixed: 1 - rr - bb };
}

// ── Geometría ──
/** Área de un corral con L metros de malla. 'rect': 4 lados; 'wall': 3 lados (un muro). w = ancho. */
export const fenceArea = (L: number, mode: 'rect' | 'wall', w: number) => (mode === 'rect' ? w * (L / 2 - w) : w * (L - 2 * w));
export function maxFenceArea(L: number, mode: 'rect' | 'wall', step = 0.5): number {
  let best = 0;
  const maxW = mode === 'rect' ? L / 2 : L / 2;
  for (let w = step; w < maxW; w += step) best = Math.max(best, fenceArea(L, mode, w));
  return best;
}
