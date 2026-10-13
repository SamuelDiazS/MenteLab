/** Modelos de simulación: reglas explícitas y deterministas (mismos valores → mismos resultados). */
export interface ParamDef { id: string; label: string; unit?: string; min: number; max: number; step: number; def: number }
export interface SimOutput {
  xLabels: (string | number)[];
  xLabel: string;
  yLabel: string;
  series: { name: string; values: number[]; className: string; dashed?: boolean }[];
  metrics: { label: string; value: string }[];
  goalMet: boolean;
  goalReport: string;
}
export type Params = Record<string, number>;
export interface SimModel {
  id: 'ramp' | 'lake' | 'foxes' | 'reaction';
  title: string;
  context: string;
  rules: string[];
  goal: string;
  params: ParamDef[];
  run: (p: Params) => SimOutput;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

// ── Rampa (física): sin fricción, a = g·sen θ, t = √(2L/a). La masa no interviene. ──
export const RAMP_LENGTH = 4;
export const rampTime = (angleDeg: number) => Math.sqrt((2 * RAMP_LENGTH) / (9.8 * Math.sin((angleDeg * Math.PI) / 180)));
export const RAMP_GOAL = 1.2;

// ── Laguna (biología): fertilizante → algas → oxígeno → peces. ──
export const LAKE_WEEKS = 8;
export function lakeSim(fert: number, aer: number) {
  let A = 1, F = 10;
  const algae: number[] = [], oxy: number[] = [], fish: number[] = [];
  for (let w = 1; w <= LAKE_WEEKS; w++) {
    A = A + 0.5 * fert - 0.15 * A; // las algas crecen con los nutrientes y se pierden 15 % por semana
    const O = Math.max(0, 9 - 0.5 * A + 1.0 * aer); // las algas consumen oxígeno; cada aireador aporta +1 mg/L
    F = Math.max(0, F + (0.2 * F * (O - 5)) / 4); // los peces crecen si O > 5 mg/L y disminuyen si O < 5
    algae.push(A); oxy.push(O); fish.push(F);
  }
  return { algae, oxy, fish };
}
export const LAKE_FISH_GOAL = 30;
export const LAKE_MIN_FERT = 2;

// ── Conejos y zorros (ecología): depredación con refugios. ──
export const FOX_SEASONS = 12;
export function foxSim(foxes0: number, refuge: number) {
  let R = 60, Fx = foxes0;
  const rabbits: number[] = [R], foxes: number[] = [Fx];
  for (let s = 1; s <= FOX_SEASONS; s++) {
    const eaten = 0.03 * R * (1 - refuge) * Fx; // encuentros depredador-presa, reducidos por los refugios
    const nextR = R + 0.3 * R * (1 - R / 100) - eaten; // crecimiento logístico, capacidad 100
    const nextF = Fx + 0.15 * eaten - 0.3 * Fx; // los zorros se reproducen según lo que comen y mueren 30 %
    R = Math.max(0, nextR); Fx = Math.max(0, nextF);
    rabbits.push(R); foxes.push(Fx);
  }
  return { rabbits, foxes };
}
export const FOX_GOAL = { rabbits: 60, foxes: 2.5 };

// ── Reacción (química): la velocidad se duplica cada 10 °C y es proporcional a la superficie. ──
export const reactionTime = (tempC: number, surface: number) => 160 / (2 ** ((tempC - 20) / 10) * surface);
export const REACTION_GOAL = { time: 25, maxTemp: 40 };

export const MODELS: Record<SimModel['id'], SimModel> = {
  ramp: {
    id: 'ramp', title: 'La rampa del laboratorio',
    context: 'Un carrito baja por una rampa lisa de 4 m. Puedes cambiar la inclinación y la masa del carrito.',
    rules: ['Sin fricción, la aceleración es a = 9,8 · sen(ángulo).', 'El tiempo de bajada es t = √(2·4 ÷ a).', 'La masa no aparece en la fórmula.'],
    goal: 'Lograr que el carrito llegue al final en 1,2 s o menos.',
    params: [
      { id: 'angle', label: 'Ángulo de la rampa', unit: '°', min: 10, max: 60, step: 5, def: 20 },
      { id: 'mass', label: 'Masa del carrito', unit: 'kg', min: 1, max: 5, step: 1, def: 1 },
    ],
    run: (p) => {
      const a = 9.8 * Math.sin((p.angle * Math.PI) / 180);
      const t = rampTime(p.angle);
      const times = Array.from({ length: 11 }, (_, i) => r1(i * 0.2));
      return {
        xLabels: times, xLabel: 'tiempo (s)', yLabel: 'distancia (m)',
        series: [{ name: 'Distancia recorrida', values: times.map((x) => Math.min(RAMP_LENGTH, 0.5 * a * x * x)), className: 'text-c-ciencias' }],
        metrics: [{ label: 'Aceleración', value: `${r2(a)} m/s²` }, { label: 'Tiempo de bajada', value: `${r2(t)} s` }],
        goalMet: t <= RAMP_GOAL, goalReport: `Tiempo de bajada: ${r2(t)} s (meta ≤ ${RAMP_GOAL} s).`,
      };
    },
  },
  lake: {
    id: 'lake', title: 'La laguna y la finca vecina',
    context: 'Una finca fertiliza sus cultivos junto a una laguna con 10 peces. Simula 8 semanas.',
    rules: ['Las algas crecen con el fertilizante (A = A + 0,5·fert − 0,15·A).', 'El oxígeno es 9 − 0,5·algas + 1 por cada aireador (mg/L).', 'Los peces aumentan si el oxígeno supera 5 mg/L y disminuyen si baja de 5.'],
    goal: `Terminar con al menos ${LAKE_FISH_GOAL} peces. La finca necesita usar al menos ${LAKE_MIN_FERT} unidades de fertilizante.`,
    params: [
      { id: 'fert', label: 'Fertilizante usado', unit: 'u/semana', min: 0, max: 4, step: 1, def: 0 },
      { id: 'aer', label: 'Aireadores instalados', min: 0, max: 2, step: 1, def: 0 },
    ],
    run: (p) => {
      const s = lakeSim(p.fert, p.aer);
      const weeks = s.fish.map((_, i) => i + 1);
      const fish = s.fish[s.fish.length - 1];
      const ok = fish >= LAKE_FISH_GOAL && p.fert >= LAKE_MIN_FERT;
      return {
        xLabels: weeks, xLabel: 'semana', yLabel: 'valor',
        series: [{ name: 'Peces', values: s.fish, className: 'text-c-ciencias' }, { name: 'Oxígeno (mg/L)', values: s.oxy, className: 'text-c-ingles', dashed: true }, { name: 'Algas', values: s.algae, className: 'text-c-lectura', dashed: true }],
        metrics: [{ label: 'Peces finales', value: String(r1(fish)) }, { label: 'Oxígeno final', value: `${r2(s.oxy[s.oxy.length - 1])} mg/L` }, { label: 'Algas finales', value: String(r1(s.algae[s.algae.length - 1])) }],
        goalMet: ok,
        goalReport: ok ? `Peces finales: ${r1(fish)}. Se cumple la meta.` : p.fert < LAKE_MIN_FERT ? 'La finca necesita al menos 2 unidades de fertilizante.' : `Peces finales: ${r1(fish)} (meta ≥ ${LAKE_FISH_GOAL}).`,
      };
    },
  },
  foxes: {
    id: 'foxes', title: 'La reserva de conejos y zorros',
    context: 'Una reserva tiene 60 conejos. Decide cuántos zorros introducir y qué parte de los conejos puede esconderse en refugios.',
    rules: ['Cada temporada los zorros comen 0,03 · conejos · zorros · (1 − refugio).', 'Los conejos crecen hasta una capacidad de 100.', 'Los zorros aumentan 0,15 por cada conejo comido y mueren un 30 % cada temporada.'],
    goal: `Después de ${FOX_SEASONS} temporadas, mantener al menos ${FOX_GOAL.rabbits} conejos y al menos ${FOX_GOAL.foxes} zorros.`,
    params: [
      { id: 'foxes', label: 'Zorros iniciales', min: 1, max: 12, step: 1, def: 1 },
      { id: 'refuge', label: 'Conejos en refugio', unit: '%', min: 0, max: 50, step: 25, def: 0 },
    ],
    run: (p) => {
      const s = foxSim(p.foxes, p.refuge / 100);
      const seasons = s.rabbits.map((_, i) => i);
      const R = s.rabbits[FOX_SEASONS], F = s.foxes[FOX_SEASONS];
      const ok = R >= FOX_GOAL.rabbits && F >= FOX_GOAL.foxes;
      return {
        xLabels: seasons, xLabel: 'temporada', yLabel: 'individuos',
        series: [{ name: 'Conejos', values: s.rabbits, className: 'text-c-lectura' }, { name: 'Zorros (×10)', values: s.foxes.map((f) => f * 10), className: 'text-c-sociales' }],
        metrics: [{ label: 'Conejos finales', value: String(r1(R)) }, { label: 'Zorros finales', value: String(r2(F)) }],
        goalMet: ok, goalReport: `Conejos: ${r1(R)} (meta ≥ ${FOX_GOAL.rabbits}); zorros: ${r2(F)} (meta ≥ ${FOX_GOAL.foxes}).`,
      };
    },
  },
  reaction: {
    id: 'reaction', title: 'La tableta efervescente',
    context: 'Una tableta se disuelve en agua con una reacción química. Puedes cambiar la temperatura y qué tan triturada está.',
    rules: ['La velocidad de reacción se duplica por cada 10 °C que sube la temperatura.', 'La velocidad es proporcional a la superficie expuesta (entera = 1, partida = 2, polvo = 4).', 'A 20 °C y superficie 1, la reacción tarda 160 s.'],
    goal: `Que la reacción termine en ${REACTION_GOAL.time} s o menos sin superar ${REACTION_GOAL.maxTemp} °C (por seguridad).`,
    params: [
      { id: 'temp', label: 'Temperatura del agua', unit: '°C', min: 20, max: 80, step: 10, def: 20 },
      { id: 'surface', label: 'Trituración (1 entera, 2 partida, 3 polvo)', min: 1, max: 3, step: 1, def: 1 },
    ],
    run: (p) => {
      const surface = [1, 2, 4][p.surface - 1]; // entera = 1, partida = 2, polvo = 4
      const t = reactionTime(p.temp, surface);
      const xs = Array.from({ length: 13 }, (_, i) => i * 10);
      const ok = t <= REACTION_GOAL.time && p.temp <= REACTION_GOAL.maxTemp;
      return {
        xLabels: xs, xLabel: 'tiempo (s)', yLabel: '% de tableta sin reaccionar',
        series: [{ name: 'Tableta restante', values: xs.map((x) => Math.max(0, 100 * (1 - x / t))), className: 'text-c-matematicas' }],
        metrics: [{ label: 'Duración', value: `${r1(t)} s` }, { label: 'Superficie usada', value: String(surface) }],
        goalMet: ok,
        goalReport: p.temp > REACTION_GOAL.maxTemp ? `Superas los ${REACTION_GOAL.maxTemp} °C permitidos.` : `Duración: ${r1(t)} s (meta ≤ ${REACTION_GOAL.time} s).`,
      };
    },
  },
};
