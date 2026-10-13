import type { BaseChallenge } from '../shared/ChallengeRunner';
import type { DesignGroup } from './logic';
import type { SimModel } from './models';

export interface ClassifyChallenge extends BaseChallenge {
  kind: 'classify'; scenario: string; table?: { caption: string; head: string[]; rows: (string | number)[][] };
  prompt: string; categories: { id: string; label: string }[]; items: { id: string; text: string; answer: string }[]; hints: string[];
}
export interface SimChallenge extends BaseChallenge {
  kind: 'sim'; model: SimModel['id'];
  prediction: { question: string; options: { id: string; text: string }[]; correct: string };
  hints: string[];
}
export interface DesignChallenge extends BaseChallenge {
  kind: 'design'; hypothesis: string; variable: string; varLabels: Record<string, string>; groups: DesignGroup[]; hints: string[];
}
export type CienciasChallenge = ClassifyChallenge | SimChallenge | DesignChallenge;

const DATA_CATS = [{ id: 'datos', label: 'Lo muestran los datos' }, { id: 'suposicion', label: 'Es una suposición' }, { id: 'contradice', label: 'Contradice los datos' }];

export const CIENCIAS_CHALLENGES: CienciasChallenge[] = [
  {
    id: 'ci-1-variables', kind: 'classify', skill: 'ciencias.variables', difficulty: 1,
    title: 'Cuaderno 1 · Plantas y luz',
    scenario: 'Una estudiante quiere saber si la cantidad de luz afecta el crecimiento de plantas de fríjol. Usa cuatro grupos de plantas: uno con 2 horas de luz al día, otro con 4, otro con 8 y otro con 12. Todas son de la misma especie, están en macetas iguales con la misma tierra y reciben 50 mL de agua cada día. Después de tres semanas mide la altura de cada planta.',
    prompt: 'Clasifica cada elemento del experimento.',
    categories: [{ id: 'independiente', label: 'Independiente' }, { id: 'dependiente', label: 'Dependiente' }, { id: 'control', label: 'Control' }],
    items: [
      { id: 'a', text: 'Horas de luz al día que recibe cada grupo.', answer: 'independiente' },
      { id: 'b', text: 'Altura de las plantas después de tres semanas.', answer: 'dependiente' },
      { id: 'c', text: 'Cantidad de agua diaria (50 mL).', answer: 'control' },
      { id: 'd', text: 'Tipo de tierra de las macetas.', answer: 'control' },
      { id: 'e', text: 'Especie de planta (fríjol).', answer: 'control' },
    ],
    hints: ['La variable independiente es la que el investigador cambia a propósito.', 'La dependiente es la que se mide para ver el efecto.', 'Lo que se mantiene igual en todos los grupos es de control.'],
    explanation: 'La variable independiente es la luz, porque es lo único que se cambia entre grupos. La dependiente es la altura, que se mide como respuesta. El agua, la tierra y la especie son variables de control: se mantienen iguales para que las diferencias en altura puedan atribuirse a la luz y no a otra causa.',
  },
  {
    id: 'ci-1-datos', kind: 'classify', skill: 'ciencias.datos', difficulty: 1,
    title: 'Cuaderno 2 · Azúcar en agua',
    scenario: 'Se midió cuánto tardan 5 g de azúcar en disolverse por completo en 200 mL de agua a distintas temperaturas.',
    table: { caption: 'Tiempo de disolución según la temperatura', head: ['Temperatura (°C)', 'Tiempo (s)'], rows: [[10, 95], [30, 60], [50, 35], [70, 20]] },
    prompt: 'Para cada enunciado decide si los datos lo muestran, es una suposición o los contradice.',
    categories: DATA_CATS,
    items: [
      { id: 'a', text: 'A mayor temperatura, el azúcar se disolvió en menos tiempo.', answer: 'datos' },
      { id: 'b', text: 'A 50 °C el azúcar tardó 35 segundos en disolverse.', answer: 'datos' },
      { id: 'c', text: 'El azúcar se disuelve más rápido porque las moléculas de agua se mueven más rápido.', answer: 'suposicion' },
      { id: 'd', text: 'A 90 °C el azúcar se disolverá en menos de 20 segundos.', answer: 'suposicion' },
      { id: 'e', text: 'A 10 °C el azúcar se disolvió en 20 segundos.', answer: 'contradice' },
    ],
    hints: ['Un dato se puede leer directamente en la tabla.', 'Una explicación del «por qué» o una predicción fuera del rango medido no está en los datos.', 'Si la tabla dice otra cosa, el enunciado contradice los datos.'],
    explanation: 'Los enunciados a y b se leen directamente en la tabla. El c es una explicación posible (modelo de partículas), pero la tabla no la prueba. El d extrapola fuera del rango medido (hasta 70 °C): puede ser razonable, pero es una suposición. El e contradice la tabla, que registra 95 s a 10 °C.',
  },
  {
    id: 'ci-1-ramp', kind: 'sim', model: 'ramp', skill: 'ciencias.simulacion', difficulty: 1,
    title: 'Cuaderno 3 · Rampa y movimiento',
    prediction: { question: 'Hipótesis: si duplicas la masa del carrito (sin cambiar el ángulo), el tiempo de bajada…', options: [{ id: 'menos', text: 'disminuirá' }, { id: 'igual', text: 'será igual' }, { id: 'mas', text: 'aumentará' }], correct: 'igual' },
    hints: ['Mira las reglas del modelo: ¿aparece la masa en alguna fórmula?', 'La inclinación sí cambia la aceleración. ¿Hacia dónde conviene moverla?', 'Prueba un ángulo de 35° o más.'],
    explanation: 'En una rampa sin fricción la aceleración depende solo del ángulo (a = g·sen θ), no de la masa. Por eso duplicar la masa no cambia el tiempo: lo que acorta la bajada es aumentar el ángulo. A partir de 35° el tiempo es menor que 1,2 s. Un buen experimento cambia una variable a la vez.',
  },
  {
    id: 'ci-2-lake', kind: 'sim', model: 'lake', skill: 'ciencias.simulacion', difficulty: 2,
    title: 'Cuaderno 4 · Fertilizante y peces',
    prediction: { question: 'Hipótesis: si aumentas el fertilizante sin instalar aireadores, el oxígeno al final de las 8 semanas…', options: [{ id: 'baja', text: 'disminuirá' }, { id: 'igual', text: 'quedará igual' }, { id: 'sube', text: 'aumentará' }], correct: 'baja' },
    hints: ['Sigue la cadena: fertilizante → algas → oxígeno → peces.', 'La finca necesita al menos 2 unidades; con eso solas los peces no llegan a la meta.', 'Los aireadores suben el oxígeno sin cambiar las algas.'],
    explanation: 'Más fertilizante alimenta más algas, que consumen oxígeno; con menos oxígeno los peces dejan de crecer. Para cumplir ambas condiciones (≥ 2 unidades y ≥ 30 peces) hay que compensar con aireadores: por ejemplo, 2 unidades con 1 aireador, o 3 con 2. Es una relación de causa y efecto en cadena, y el modelo permite comprobar qué combinaciones funcionan.',
  },
  {
    id: 'ci-2-diseno', kind: 'design', skill: 'ciencias.diseno', difficulty: 2,
    title: 'Cuaderno 5 · ¿Qué comparación sirve?',
    hypothesis: 'La cantidad de sal afecta el tiempo que tarda en hervir el agua.', variable: 'sal',
    varLabels: { sal: 'Sal (g)', agua: 'Agua (mL)', estufa: 'Potencia de la estufa' },
    groups: [
      { id: 'G1', values: { sal: 0, agua: 500, estufa: 'Alta' } },
      { id: 'G2', values: { sal: 10, agua: 500, estufa: 'Alta' } },
      { id: 'G3', values: { sal: 10, agua: 1000, estufa: 'Alta' } },
      { id: 'G4', values: { sal: 20, agua: 500, estufa: 'Media' } },
    ],
    hints: ['Para probar el efecto de una variable, solo ella puede cambiar entre los dos grupos.', 'Compara columna por columna: ¿en cuántas variables difieren G1 y G2?', 'Descarta las parejas que cambian la sal y además otra cosa.'],
    explanation: 'La única pareja que cambia solo la sal es G1 y G2 (0 g contra 10 g, con el mismo volumen y la misma potencia). G2 y G3 cambian el volumen de agua; G1 y G4 cambian sal y potencia a la vez. Si varias cosas cambian juntas, no se puede saber cuál produjo la diferencia.',
  },
  {
    id: 'ci-2-datos', kind: 'classify', skill: 'ciencias.datos', difficulty: 2,
    title: 'Cuaderno 6 · Conejos y zorros',
    scenario: 'Un parque registró cada año cuántos conejos y zorros había en una zona.',
    table: { caption: 'Población registrada', head: ['Año', 'Conejos', 'Zorros'], rows: [[1, 400, 20], [2, 520, 25], [3, 610, 38], [4, 470, 44], [5, 380, 36]] },
    prompt: 'Para cada enunciado decide si los datos lo muestran, es una suposición o los contradice.',
    categories: DATA_CATS,
    items: [
      { id: 'a', text: 'Los zorros alcanzaron su máximo registrado en el año 4.', answer: 'datos' },
      { id: 'b', text: 'Los conejos llegaron a su máximo un año antes que los zorros.', answer: 'datos' },
      { id: 'c', text: 'Los zorros fueron la causa de que los conejos disminuyeran.', answer: 'suposicion' },
      { id: 'd', text: 'En el año 2 había más zorros que conejos.', answer: 'contradice' },
      { id: 'e', text: 'La población de conejos aumentó todos los años.', answer: 'contradice' },
    ],
    hints: ['Busca en la tabla el valor máximo de cada columna.', 'Que dos cosas cambien a la vez no demuestra que una cause la otra.', 'Revisa los años 4 y 5 para los conejos.'],
    explanation: 'Los zorros llegan a 44 en el año 4 (a) y los conejos a 610 en el año 3 (b). El enunciado c plantea una causa: los datos muestran que las poblaciones cambian juntas, no que una cause la otra. El d es falso (25 zorros frente a 520 conejos) y el e también, porque los conejos bajan desde el año 4.',
  },
  {
    id: 'ci-3-foxes', kind: 'sim', model: 'foxes', skill: 'ciencias.simulacion', difficulty: 3,
    title: 'Cuaderno 7 · La reserva en equilibrio',
    prediction: { question: 'Hipótesis: si aumentas los refugios para los conejos, a largo plazo la población de zorros…', options: [{ id: 'baja', text: 'disminuirá' }, { id: 'igual', text: 'no cambiará' }, { id: 'sube', text: 'aumentará' }], correct: 'baja' },
    hints: ['Los zorros dependen de los conejos que logran cazar.', 'Pon el refugio en 0 % y prueba distintos números de zorros.', 'Con muchos zorros los conejos caen demasiado; con pocos, los zorros no se sostienen.'],
    explanation: 'Los refugios protegen a los conejos, pero reducen el alimento disponible para los zorros, y estos acaban disminuyendo: ni siquiera con 12 zorros iniciales se mantiene la meta cuando hay refugios. Sin refugios, entre 2 y 6 zorros iniciales logran mantener ambas poblaciones. Las poblaciones se regulan mutuamente: ayudar a una especie puede perjudicar a la otra.',
  },
  {
    id: 'ci-3-diseno', kind: 'design', skill: 'ciencias.diseno', difficulty: 3,
    title: 'Cuaderno 8 · Mármol y vinagre',
    hypothesis: 'El tamaño de los trozos de mármol afecta la rapidez con que reacciona con el vinagre.', variable: 'trozo',
    varLabels: { trozo: 'Tamaño del trozo', vinagre: 'Vinagre (mL)', temp: 'Temperatura (°C)', masa: 'Masa de mármol (g)' },
    groups: [
      { id: 'G1', values: { trozo: 'Entero', vinagre: 100, temp: 20, masa: 10 } },
      { id: 'G2', values: { trozo: 'Triturado', vinagre: 100, temp: 20, masa: 10 } },
      { id: 'G3', values: { trozo: 'Triturado', vinagre: 200, temp: 20, masa: 10 } },
      { id: 'G4', values: { trozo: 'Polvo', vinagre: 100, temp: 30, masa: 10 } },
      { id: 'G5', values: { trozo: 'Polvo', vinagre: 100, temp: 20, masa: 10 } },
    ],
    hints: ['Hay más de una pareja válida: busca las que difieren solo en el tamaño del trozo.', 'G4 cambia el tamaño y además la temperatura.', 'G1, G2 y G5 comparten todo menos el tamaño.'],
    explanation: 'Son válidas las parejas G1–G2, G1–G5 y G2–G5: en ellas solo cambia el tamaño del trozo. G3 cambia además el volumen de vinagre y G4 cambia además la temperatura, así que cualquier pareja con G3 o G4 mezcla dos causas posibles. Cuando varias comparaciones válidas existen, cualquiera de ellas permite responder la hipótesis.',
  },
  {
    id: 'ci-3-reaction', kind: 'sim', model: 'reaction', skill: 'ciencias.simulacion', difficulty: 3,
    title: 'Cuaderno 9 · Tableta efervescente',
    prediction: { question: 'Hipótesis: si trituras la tableta (más superficie expuesta) sin cambiar la temperatura, la reacción terminará…', options: [{ id: 'antes', text: 'antes' }, { id: 'igual', text: 'al mismo tiempo' }, { id: 'despues', text: 'después' }], correct: 'antes' },
    hints: ['Hay dos formas de acelerar la reacción: temperatura y superficie.', 'La temperatura está limitada a 40 °C por seguridad.', 'A 40 °C la velocidad ya se multiplicó por 4; ¿qué falta para llegar a 25 s?'],
    explanation: 'La reacción tarda 160 s a 20 °C. A 40 °C la velocidad se multiplica por 4 (dos duplicaciones) y el tiempo baja a 40 s. Triturar la tableta duplica o cuadruplica la superficie y la velocidad: con 40 °C y tableta partida son 20 s; con 30 °C y polvo también son 20 s. Más superficie expuesta significa más choques entre partículas por segundo.',
  },
];
