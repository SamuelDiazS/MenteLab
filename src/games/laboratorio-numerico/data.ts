import type { BaseChallenge } from '../shared/ChallengeRunner';
import { bestBudget, type BudgetItem } from './logic';

export interface RatioChallenge extends BaseChallenge { kind: 'ratio'; prompt: string; unit: string; parts: { name: string; ratio: number }[]; total: number; hints: string[] }
export interface IntervalChallenge extends BaseChallenge { kind: 'interval'; prompt: string; data: number[]; xLabel: string; yLabel: string; unit: string; mode: 'rise' | 'fall'; hints: string[] }
export interface BudgetChallenge extends BaseChallenge { kind: 'budget'; prompt: string; budget: number; items: BudgetItem[]; valueName: string; hints: string[] }
export interface FunctionChallenge extends BaseChallenge {
  kind: 'function'; prompt: string; form: 'linear' | 'quad';
  targets: [number, number][]; xMax: number; yMax: number; xLabel: string; yLabel: string; hints: string[];
}
export interface ProbabilityChallenge extends BaseChallenge {
  kind: 'probability'; prompt: string; variant: 'urns' | 'two-draws';
  urns?: { id: string; name: string; red: number; blue: number }[];
  bag?: { red: number; blue: number };
  hints: string[];
}
export interface FenceChallenge extends BaseChallenge { kind: 'fence'; prompt: string; length: number; mode: 'rect' | 'wall'; hints: string[] }
export type MatChallenge = RatioChallenge | IntervalChallenge | BudgetChallenge | FunctionChallenge | ProbabilityChallenge | FenceChallenge;

const huerta: BudgetItem[] = [
  { id: 'tomate', name: 'Semillas de tomate', price: 4, value: 3, min: 0, max: 6 },
  { id: 'lechuga', name: 'Plántulas de lechuga', price: 6, value: 5, min: 0, max: 6 },
  { id: 'abono', name: 'Sacos de abono', price: 10, value: 9, min: 1, max: 4 },
  { id: 'malla', name: 'Mallas de sombra', price: 15, value: 14, min: 0, max: 3 },
  { id: 'herram', name: 'Herramientas', price: 20, value: 16, min: 0, max: 2 },
];
const feria: BudgetItem[] = [
  { id: 'micro', name: 'Microscopios', price: 18, value: 20, min: 2, max: 4 },
  { id: 'reactivo', name: 'Cajas de reactivos', price: 7, value: 6, min: 0, max: 8 },
  { id: 'impreso', name: 'Carteleras impresas', price: 5, value: 3, min: 0, max: 6 },
  { id: 'panel', name: 'Paneles de exhibición', price: 12, value: 13, min: 1, max: 5 },
  { id: 'sensor', name: 'Sensores digitales', price: 25, value: 30, min: 0, max: 3 },
];
export const HUERTA_OPT = bestBudget(huerta, 60);
export const FERIA_OPT = bestBudget(feria, 120);

export const MAT_CHALLENGES: MatChallenge[] = [
  {
    id: 'mt-1-ratio', kind: 'ratio', skill: 'matematicas.proporcion', difficulty: 1,
    title: 'Banco 1 · Pintura de la fachada',
    prompt: 'La mezcla de pintura debe llevar azul, amarillo y blanco en razón 2 : 3 : 5. Necesitas exactamente 30 litros. Ajusta los litros de cada color.',
    unit: 'L', parts: [{ name: 'Azul', ratio: 2 }, { name: 'Amarillo', ratio: 3 }, { name: 'Blanco', ratio: 5 }], total: 30,
    hints: ['Una razón 2 : 3 : 5 reparte el total en 2 + 3 + 5 partes iguales.', '¿Cuántos litros vale una parte? Divide el total entre el número de partes.', 'Multiplica los litros de una parte por 2, 3 y 5.'],
    explanation: 'La razón 2 : 3 : 5 tiene 2 + 3 + 5 = 10 partes. Cada parte equivale a 30 ÷ 10 = 3 litros. Azul: 2 × 3 = 6 L; amarillo: 3 × 3 = 9 L; blanco: 5 × 3 = 15 L. Comprobación: 6 + 9 + 15 = 30 y 6 : 9 : 15 se simplifica a 2 : 3 : 5.',
  },
  {
    id: 'mt-1-interval', kind: 'interval', skill: 'matematicas.graficas', difficulty: 1,
    title: 'Banco 2 · La incubadora',
    prompt: 'La gráfica muestra la temperatura de una incubadora durante 6 horas. Elige el intervalo en que la temperatura subió más rápido.',
    data: [20, 22, 26, 35, 36, 36, 33], xLabel: 'Hora', yLabel: '°C', unit: '°C', mode: 'rise',
    hints: ['La rapidez de cambio es cuánto varía la temperatura en cada hora.', 'Una línea más inclinada hacia arriba indica un aumento mayor.', 'Calcula la diferencia entre cada par de puntos consecutivos y compara.'],
    explanation: 'Los cambios por hora son: +2, +4, +9, +1, 0 y −3 °C. El mayor aumento es +9 °C, entre la hora 2 y la hora 3: es el tramo más inclinado. Entre las horas 4 y 5 la gráfica es horizontal (no cambia) y entre 5 y 6 desciende.',
  },
  {
    id: 'mt-1-budget', kind: 'budget', skill: 'matematicas.optimizacion', difficulty: 1,
    title: 'Banco 3 · Huerta escolar',
    prompt: 'Tienes $60 (miles de pesos) para equipar la huerta. Cada compra aporta puntos de producción. Debes comprar al menos 1 saco de abono. Consigue el máximo de puntos sin pasarte del presupuesto.',
    budget: 60, items: huerta, valueName: 'puntos de producción',
    hints: ['Compara cuántos puntos da cada artículo por cada $1.000 gastados.', 'No siempre conviene lo más barato ni lo que más puntos da por unidad.', 'Recuerda que el abono es obligatorio: ya cuesta $10 del total.'],
    explanation: `Tras comprar el abono obligatorio ($10, 9 puntos), quedan $50. El máximo posible es ${HUERTA_OPT} puntos en total; se encuentra comparando combinaciones (problema de optimización con presupuesto). La razón puntos/precio ayuda a orientarse, pero hay que revisar que el presupuesto se aproveche casi por completo: un artículo eficiente que deja dinero sin usar puede perder frente a otra combinación.`,
  },
  {
    id: 'mt-2-linear', kind: 'function', form: 'linear', skill: 'matematicas.funciones', difficulty: 2,
    title: 'Banco 4 · Tarifa de transporte',
    prompt: 'El costo de un viaje es f(x) = m·x + b, con x en kilómetros y f(x) en miles de pesos. La recta debe pasar por los puntos marcados: un viaje de 2 km cuesta 7 y uno de 6 km cuesta 15.',
    targets: [[2, 7], [6, 15]], xMax: 8, yMax: 20, xLabel: 'km', yLabel: 'miles de $',
    hints: ['La pendiente m es cuánto sube el costo por cada km adicional.', 'Entre los dos puntos, x aumenta 4 y el costo aumenta 8.', 'Con m conocida, ajusta b para que la recta pase por (2, 7).'],
    explanation: 'La pendiente es m = (15 − 7) ÷ (6 − 2) = 2: cada kilómetro cuesta $2.000. El intercepto se halla con un punto: 7 = 2·2 + b, de donde b = 3 (el valor fijo de la bajada de bandera). La función es f(x) = 2x + 3 y verifica el segundo punto: 2·6 + 3 = 15.',
  },
  {
    id: 'mt-2-prob', kind: 'probability', variant: 'urns', skill: 'matematicas.probabilidad', difficulty: 2,
    title: 'Banco 5 · Elige la urna',
    prompt: 'Ganas si sacas una bola roja sin mirar. ¿En cuál urna tienes mayor probabilidad de ganar? Luego escribe esa probabilidad en porcentaje.',
    urns: [{ id: 'A', name: 'Urna A', red: 3, blue: 7 }, { id: 'B', name: 'Urna B', red: 2, blue: 3 }, { id: 'C', name: 'Urna C', red: 5, blue: 10 }],
    hints: ['La probabilidad de rojo es rojas ÷ total de bolas de esa urna.', 'No compares solo el número de bolas rojas: cada urna tiene un total distinto.', 'Convierte cada fracción a porcentaje para compararlas.'],
    explanation: 'P(roja) en A = 3/10 = 30 %; en B = 2/5 = 40 %; en C = 5/15 ≈ 33,3 %. La mejor es la urna B, aunque tiene menos bolas rojas que la C: lo que importa es la proporción, no la cantidad absoluta. La probabilidad de ganar es 40 %.',
  },
  {
    id: 'mt-2-fence', kind: 'fence', skill: 'matematicas.geometria', difficulty: 2,
    title: 'Banco 6 · Corral junto al muro',
    prompt: 'Tienes 28 m de malla para encerrar un corral rectangular contra un muro, de modo que solo necesitas cercar tres lados. Elige el ancho (los dos lados perpendiculares al muro) para que el área sea la mayor posible.',
    length: 28, mode: 'wall',
    hints: ['Si el ancho es w, el lado paralelo al muro mide 28 − 2w.', 'El área es w · (28 − 2w). Prueba varios valores de w y observa cómo cambia.', 'El área crece hasta cierto punto y luego baja: busca la mitad entre los extremos posibles.'],
    explanation: 'Con ancho w, el largo es 28 − 2w y el área A(w) = w(28 − 2w) = −2w² + 28w. Es una parábola que abre hacia abajo, con vértice en w = 28 ÷ 4 = 7 m. Entonces el largo es 14 m y el área máxima es 7 × 14 = 98 m². Un corral cuadrado no es lo mejor aquí: el lado paralelo al muro debe medir el doble del ancho.',
  },
  {
    id: 'mt-3-budget', kind: 'budget', skill: 'matematicas.optimizacion', difficulty: 3,
    title: 'Banco 7 · Feria de ciencias',
    prompt: 'Presupuesto: $120 (miles). Debes comprar al menos 2 microscopios y 1 panel de exhibición. Maximiza los puntos de impacto de la feria sin pasarte.',
    budget: 120, items: feria, valueName: 'puntos de impacto',
    hints: ['Cubre primero los mínimos obligatorios y mira cuánto presupuesto queda.', 'Compara el rendimiento (puntos por cada $1.000) de lo que aún puedes comprar.', 'Revisa si cambiar un artículo grande por dos pequeños aprovecha mejor el dinero que sobra.'],
    explanation: `Los mínimos obligatorios cuestan 2 × 18 + 12 = $48 y aportan 53 puntos; quedan $72 por repartir. El máximo posible es ${FERIA_OPT} puntos de impacto. La estrategia de comprar siempre lo de mayor rendimiento deja dinero sin usar en varias combinaciones, así que hay que comparar alternativas completas.`,
  },
  {
    id: 'mt-3-quad', kind: 'function', form: 'quad', skill: 'matematicas.funciones', difficulty: 3,
    title: 'Banco 8 · Puente colgante',
    prompt: 'El cable del puente sigue h(x) = a·(x − p)² + k. Debe pasar por los extremos (0, 5) y (8, 5) y tocar su punto más bajo en (4, 1). Ajusta a, p y k.',
    targets: [[0, 5], [4, 1], [8, 5]], xMax: 8, yMax: 8, xLabel: 'x (m)', yLabel: 'altura (m)',
    hints: ['El punto más bajo es el vértice: te dice p y k directamente.', 'Si el vértice está en (4, 1), ¿qué valores toman p y k?', 'Con p y k fijos, usa el punto (0, 5): 5 = a·16 + 1.'],
    explanation: 'El vértice (p, k) = (4, 1) es el punto más bajo. Sustituyendo (0, 5): 5 = a·(0 − 4)² + 1, así 16a = 4 y a = 0,25. Comprobación en (8, 5): 0,25·(8 − 4)² + 1 = 5. La función es h(x) = 0,25(x − 4)² + 1. Los extremos a igual altura confirman que el eje de simetría está en x = 4.',
  },
  {
    id: 'mt-3-two', kind: 'probability', variant: 'two-draws', skill: 'matematicas.probabilidad', difficulty: 3,
    title: 'Banco 9 · Dos extracciones',
    prompt: 'Una bolsa tiene 3 bolas rojas y 2 azules. Sacas dos bolas, una tras otra, sin devolver la primera. Elige el resultado más probable y escribe su probabilidad en porcentaje.',
    bag: { red: 3, blue: 2 },
    hints: ['Al no devolver la bola, el total baja de 5 a 4 en la segunda extracción.', 'P(dos rojas) = 3/5 · 2/4. P(dos azules) = 2/5 · 1/4.', 'Los tres resultados suman 100 %: la parte «una de cada color» es lo que queda.'],
    explanation: 'P(dos rojas) = 3/5 · 2/4 = 30 %. P(dos azules) = 2/5 · 1/4 = 10 %. Por complemento, P(una de cada color) = 100 − 30 − 10 = 60 %. El resultado más probable es una bola de cada color. Sin reemplazo, las extracciones no son independientes: la segunda depende de lo que salió primero.',
  },
];
