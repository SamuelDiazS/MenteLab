import type { BaseChallenge } from '../shared/ChallengeRunner';
import type { Constraint, Rule, SeqSpec } from './logic';

export interface SequenceChallenge extends BaseChallenge {
  kind: 'sequence';
  spec: SeqSpec;
  length: number;
  hide: number[];
  prompt: string;
  hints: string[];
}
export interface ArrangeChallenge extends BaseChallenge {
  kind: 'arrange';
  prompt: string;
  items: { id: string; label: string }[];
  slotLabel: string;
  clues: { c: Constraint; text: string }[];
  hints: string[];
}
export interface SwitchChallenge extends BaseChallenge {
  kind: 'switches';
  prompt: string;
  vars: { id: string; label: string }[];
  rules: { r: Rule; text: string }[];
  hints: string[];
}
export interface DeduceChallenge extends BaseChallenge {
  kind: 'deduce';
  prompt: string;
  premises: string[];
  options: { id: string; text: string }[];
  correct: string[];
  hints: string[];
}
export type LogicaChallenge = SequenceChallenge | ArrangeChallenge | SwitchChallenge | DeduceChallenge;

export const LOGICA_CHALLENGES: LogicaChallenge[] = [
  // ───────── Nivel 1 ─────────
  {
    id: 'lg-1-seq', kind: 'sequence', skill: 'logica.secuencias', difficulty: 1,
    title: 'Módulo 1 · Pulso constante',
    prompt: 'La máquina emite una señal numérica con una regla fija. Completa el término que falta.',
    spec: { kind: 'arith', start: 4, step: 5 }, length: 6, hide: [4],
    hints: ['Calcula cuánto cambia la señal de un término al siguiente.', 'Entre 4 y 9 hay un salto; compáralo con el salto entre 9 y 14.', 'El salto se repite siempre. Aplícalo al término anterior al hueco.'],
    explanation: 'Regla: cada término suma 5 al anterior (4, 9, 14, 19, 24, 29). Es una progresión aritmética: la diferencia entre términos consecutivos es constante, así que el término que falta es 19 + 5 = 24.',
  },
  {
    id: 'lg-1-arr', kind: 'arrange', skill: 'logica.orden', difficulty: 1,
    title: 'Módulo 2 · Línea de meta',
    prompt: 'Cuatro robots corren una prueba. Coloca a cada uno en su posición de llegada de modo que se cumplan todas las reglas.',
    items: [{ id: 'A', label: 'Ana' }, { id: 'B', label: 'Beto' }, { id: 'C', label: 'Carla' }, { id: 'D', label: 'Diego' }],
    slotLabel: 'Llegada',
    clues: [
      { c: { t: 'before', a: 'C', b: 'B' }, text: 'Carla llegó antes que Beto.' },
      { c: { t: 'notEnd', a: 'D' }, text: 'Diego no llegó ni primero ni último.' },
      { c: { t: 'immBefore', a: 'D', b: 'A' }, text: 'Ana llegó justo después de Diego.' },
      { c: { t: 'before', a: 'A', b: 'B' }, text: 'Ana llegó antes que Beto.' },
    ],
    hints: ['Empieza por la regla más restrictiva: Diego solo puede estar en la 2.ª o 3.ª posición.', 'Si Diego es 3.º, Ana sería 4.ª: ¿qué pasa entonces con Beto?', 'Orden correcto de la regla 3 y 4: Diego, Ana y luego Beto, con Carla antes de Beto.'],
    explanation: 'Diego está en la 2.ª o 3.ª posición y Ana va justo después. Si Diego fuera 3.º, Ana sería 4.ª y Beto tendría que llegar antes que Ana, lo que contradice la regla 4. Por tanto Diego es 2.º, Ana 3.ª y Beto 4.º. A Carla le queda la 1.ª: Carla, Diego, Ana, Beto. Cada regla elimina posibilidades hasta que queda una sola.',
  },
  {
    id: 'lg-1-ded', kind: 'deduce', skill: 'logica.condicionales', difficulty: 1,
    title: 'Módulo 3 · Si llueve…',
    prompt: 'Marca únicamente las conclusiones que se siguen NECESARIAMENTE de las premisas.',
    premises: ['Si llueve, el partido se aplaza.', 'El partido no se aplazó.'],
    options: [
      { id: 'a', text: 'No llovió.' },
      { id: 'b', text: 'Llovió, pero el partido se jugó igual.' },
      { id: 'c', text: 'Hizo sol durante todo el día.' },
      { id: 'd', text: 'Si el partido se aplaza, entonces llovió.' },
    ],
    correct: ['a'],
    hints: ['Si la consecuencia no ocurrió, ¿puede haber ocurrido la causa?', 'Que no llueva no obliga a que haga sol: podría estar nublado.', 'Del «si A entonces B» no se puede volver atrás: B puede tener otras causas.'],
    explanation: 'Es un modus tollens: de «si A entonces B» y «no B» se concluye «no A». Como el partido no se aplazó, no pudo haber llovido (a). La b contradice las premisas. La c no se sigue: «no llovió» no implica «hubo sol». La d es la recíproca, que no es válida: un partido puede aplazarse por otras razones.',
  },
  // ───────── Nivel 2 ─────────
  {
    id: 'lg-2-seq', kind: 'sequence', skill: 'logica.secuencias', difficulty: 2,
    title: 'Módulo 4 · Dos pulsos entrelazados',
    prompt: 'Esta señal mezcla dos reglas distintas que se alternan. Completa los dos términos que faltan.',
    spec: { kind: 'alt', odd: { start: 2, step: 2 }, even: { start: 3, ratio: 2 } }, length: 8, hide: [5, 7],
    hints: ['Prueba a leer solo los términos de las posiciones impares y luego solo los de las pares.', 'Posiciones 1, 3, 5, 7: 2, 4, 6, 8… Posiciones 2, 4, 6, 8: 3, 6, ?, ?', 'La segunda serie no suma: cada término es el doble del anterior.'],
    explanation: 'La secuencia es 2, 3, 4, 6, 6, 12, 8, 24. Los términos en posiciones impares forman 2, 4, 6, 8 (suma 2). Los de posiciones pares forman 3, 6, 12, 24 (se multiplican por 2). Cuando una secuencia no tiene una regla única, conviene separar los términos en dos subsecuencias.',
  },
  {
    id: 'lg-2-sw', kind: 'switches', skill: 'logica.condicionales', difficulty: 2,
    title: 'Módulo 5 · Panel de energía',
    prompt: 'Configura los cuatro interruptores (encendido o apagado) para que se cumplan todas las reglas del panel.',
    vars: [{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }, { id: 'C', label: 'C' }, { id: 'D', label: 'D' }],
    rules: [
      { r: { t: 'implies', a: 'A', b: 'B' }, text: 'Si A está encendido, entonces B debe estar encendido.' },
      { r: { t: 'notBoth', a: 'B', b: 'C' }, text: 'B y C nunca pueden estar encendidos a la vez.' },
      { r: { t: 'or', lits: ['C', 'D'] }, text: 'Al menos uno de C y D debe estar encendido.' },
      { r: { t: 'lit', a: 'A' }, text: 'A debe estar encendido.' },
    ],
    hints: ['Una de las reglas fija el valor de A. Empieza por ahí.', 'Con A encendido, la regla 1 obliga a B. ¿Qué dice entonces la regla 2 sobre C?', 'Con C apagado, la regla 3 decide D.'],
    explanation: 'A está encendido (regla 4); por la regla 1, B también. Como B está encendido, la regla 2 obliga a que C esté apagado. Para cumplir la regla 3 («C o D»), D debe estar encendido. Configuración: A y B y D encendidos, C apagado. Es una cadena de condicionales: cada «si… entonces» propaga el valor conocido.',
  },
  {
    id: 'lg-2-ded', kind: 'deduce', skill: 'logica.deduccion', difficulty: 2,
    title: 'Módulo 6 · Inventario de robots',
    prompt: 'Marca únicamente las conclusiones que se siguen NECESARIAMENTE de las tres premisas.',
    premises: ['Todos los robots del taller A tienen sensor.', 'Ningún robot con sensor funciona de forma manual.', 'R7 es un robot del taller A.'],
    options: [
      { id: 'a', text: 'R7 tiene sensor.' },
      { id: 'b', text: 'R7 no funciona de forma manual.' },
      { id: 'c', text: 'Todos los robots con sensor son del taller A.' },
      { id: 'd', text: 'R7 funciona de forma totalmente automática.' },
    ],
    correct: ['a', 'b'],
    hints: ['Encadena las premisas: R7 está en el taller A, y los del taller A tienen algo.', 'La segunda premisa habla de «los que tienen sensor»: ¿R7 pertenece a ese grupo?', 'Cuidado con invertir las premisas: «todos los A tienen sensor» no dice que todos los que tienen sensor sean A.'],
    explanation: 'R7 es del taller A, luego tiene sensor (a). Como ningún robot con sensor es manual, R7 no es manual (b). La c invierte la primera premisa: puede haber robots con sensor en otros talleres. La d añade información que no está: «no manual» no equivale a «totalmente automático».',
  },
  // ───────── Nivel 3 ─────────
  {
    id: 'lg-3-seq', kind: 'sequence', skill: 'logica.secuencias', difficulty: 3,
    title: 'Módulo 7 · Diferencias que crecen',
    prompt: 'Esta señal acelera. Descubre cómo cambia el salto y completa el término que falta.',
    spec: { kind: 'diffgrow', start: 1, d0: 2, dd: 2 }, length: 7, hide: [5],
    hints: ['Calcula la diferencia entre cada par de términos consecutivos.', 'Las diferencias no son constantes: míralas como una nueva secuencia.', 'Las diferencias son 2, 4, 6, 8…: aumentan de 2 en 2.'],
    explanation: 'La secuencia es 1, 3, 7, 13, 21, 31, 43. Las diferencias forman 2, 4, 6, 8, 10, 12, que crecen de 2 en 2. Cuando las diferencias no son constantes, se analiza la secuencia de las diferencias (segundo nivel): aquí es aritmética, y el término que falta es 21 + 10 = 31.',
  },
  {
    id: 'lg-3-arr', kind: 'arrange', skill: 'logica.orden', difficulty: 3,
    title: 'Módulo 8 · Jornada de charlas',
    prompt: 'Organiza cinco charlas en las cinco franjas del día de modo que se cumplan todas las reglas.',
    items: [{ id: 'M', label: 'Matemáticas' }, { id: 'A', label: 'Arte' }, { id: 'F', label: 'Física' }, { id: 'H', label: 'Historia' }, { id: 'I', label: 'Inglés' }],
    slotLabel: 'Franja',
    clues: [
      { c: { t: 'before', a: 'M', b: 'A' }, text: 'Matemáticas se presenta antes que Arte.' },
      { c: { t: 'immBefore', a: 'H', b: 'I' }, text: 'Historia se presenta justo antes que Inglés.' },
      { c: { t: 'notAt', a: 'M', i: 0 }, text: 'Matemáticas no abre la jornada.' },
      { c: { t: 'at', a: 'I', i: 4 }, text: 'Inglés cierra la jornada.' },
    ],
    hints: ['Inglés está fijo en la última franja; Historia queda en la penúltima.', 'Ya ocupadas las franjas 4 y 5, quedan Matemáticas, Arte y Física en las tres primeras.', 'Matemáticas no es la primera, pero va antes que Arte: ¿en qué orden quedan las tres?'],
    explanation: 'Inglés va en la 5.ª franja y, como Historia va justo antes, Historia es la 4.ª. En las tres primeras franjas están Matemáticas, Arte y Física. Matemáticas no abre pero va antes que Arte, así que no puede ser la 3.ª y no puede ser la 1.ª: es la 2.ª, Arte la 3.ª y Física la 1.ª. Orden: Física, Matemáticas, Arte, Historia, Inglés.',
  },
  {
    id: 'lg-3-sw', kind: 'switches', skill: 'logica.condicionales', difficulty: 3,
    title: 'Módulo 9 · Núcleo de cinco válvulas',
    prompt: 'Configura las cinco válvulas (abierta o cerrada) para que se cumplan las cinco reglas a la vez.',
    vars: ['A', 'B', 'C', 'D', 'E'].map((v) => ({ id: v, label: v })),
    rules: [
      { r: { t: 'xor', a: 'A', b: 'B' }, text: 'Exactamente una de A y B está abierta.' },
      { r: { t: 'implies', a: 'B', b: 'C' }, text: 'Si B está abierta, entonces C debe estar abierta.' },
      { r: { t: 'notBoth', a: 'C', b: 'D' }, text: 'C y D no pueden estar abiertas a la vez.' },
      { r: { t: 'iff', a: 'E', b: 'A' }, text: 'E está abierta si y solo si A está abierta.' },
      { r: { t: 'or', lits: ['!A', '!E'] }, text: 'A y E no pueden estar abiertas las dos.' },
    ],
    hints: ['Mira juntas las reglas 4 y 5: ¿pueden estar A y E abiertas a la vez? ¿Y si E y A siempre coinciden?', 'Si A está cerrada, E también. ¿Qué dice entonces la regla 1 sobre B?', 'Con B abierta, C se abre (regla 2), y la regla 3 cierra D.'],
    explanation: 'Las reglas 4 y 5 juntas fuerzan que A esté cerrada: si A estuviera abierta, E también (regla 4) y eso viola la regla 5. Con A cerrada, E está cerrada. La regla 1 obliga a que B esté abierta, la 2 abre C y la 3 cierra D. Configuración: solo B y C abiertas. Hay una única solución; combinar reglas suele ser más rápido que probar al azar.',
  },
  {
    id: 'lg-3-con', kind: 'deduce', skill: 'logica.contradiccion', difficulty: 3,
    title: 'Módulo 10 · Registro de accesos',
    prompt: 'Una de estas afirmaciones es incompatible con otra. Marca las DOS que no pueden ser verdad al mismo tiempo.',
    premises: ['Registro de la bóveda. Lee las cuatro afirmaciones y busca la pareja que choca.'],
    options: [
      { id: 'a', text: 'La bóveda solo se abre con claves pares mayores que 50.' },
      { id: 'b', text: 'La clave 38 abrió la bóveda.' },
      { id: 'c', text: 'La bóveda se abrió el lunes.' },
      { id: 'd', text: 'El lunes hubo un solo acceso, con la clave 62.' },
    ],
    correct: ['a', 'b'],
    hints: ['Dos afirmaciones se contradicen si aceptar una obliga a rechazar la otra, sin necesitar supuestos nuevos.', 'Evalúa si 38 cumple las condiciones de la afirmación a.', 'La b y la d solo chocarían si supieras que 38 abrió el lunes; el texto no lo dice.'],
    explanation: 'La clave 38 es par, pero no es mayor que 50, así que no cumple la condición de la afirmación a. Si a es verdadera, b es falsa: es la única pareja que se contradice sin añadir supuestos. Las afirmaciones b y d no chocan necesariamente porque b no dice cuándo se usó la clave 38; c y d son compatibles.',
  },
];
