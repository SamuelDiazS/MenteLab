import type { BaseChallenge } from '../shared/ChallengeRunner';
import { findAllocation, SECTORS, type Effects, type Goals, type Weights } from './logic';

export interface CityBudgetChallenge extends BaseChallenge {
  kind: 'budget'; scenario: string; facts: { label: string; value: string }[]; weights: Weights; goals: Goals; hints: string[];
}
export interface ClassifyChallenge extends BaseChallenge {
  kind: 'classify'; scenario: string; table?: { caption: string; head: string[]; rows: (string | number)[][] };
  prompt: string; categories: { id: string; label: string }[]; items: { id: string; text: string; answer: string }[]; hints: string[];
}
export interface DecisionChallenge extends BaseChallenge {
  kind: 'decision'; scenario: string;
  options: { id: string; name: string; desc: string; effects: Effects }[];
  criteria: { id: string; label: string; desc: string; weights: Partial<Effects> }[];
  data: { id: string; text: string; supports: string[] }[];
  hints: string[];
}
export type SocialesChallenge = CityBudgetChallenge | ClassifyChallenge | DecisionChallenge;

const W1: Weights = { bienestar: [.25, .35, .15, .15, .10], acceso: [.25, .30, .35, 0, .10], equidad: [.35, .35, .20, 0, .10], convivencia: [.20, 0, .10, .5, .20], sostenibilidad: [.1, 0, .3, 0, .6] };
const W2: Weights = { bienestar: [.20, .30, .20, .20, .10], acceso: [.15, .25, .45, .05, .10], equidad: [.40, .25, .25, 0, .10], convivencia: [.15, .05, .15, .55, .10], sostenibilidad: [.05, 0, .35, 0, .60] };
const W3: Weights = { bienestar: [.30, .30, .10, .20, .10], acceso: [.20, .35, .30, 0, .15], equidad: [.30, .30, .25, .05, .10], convivencia: [.25, .05, .10, .45, .15], sostenibilidad: [.05, .05, .30, 0, .60] };
const G1: Goals = { acceso: 55, bienestar: 52, equidad: 55 };
const G2: Goals = { acceso: 58, equidad: 58, convivencia: 40 };
const G3: Goals = { bienestar: 52, acceso: 52, equidad: 52, convivencia: 45, sostenibilidad: 40 };

const example = (w: Weights, g: Goals) => {
  const a = findAllocation(w, g);
  return a ? SECTORS.map((s) => `${s.label} ${a[s.id]}`).join(', ') : '—';
};

const EVID = [{ id: 'evidencia', label: 'Evidencia verificable' }, { id: 'opinion', label: 'Opinión o valoración' }];

export const SOCIALES_CHALLENGES: SocialesChallenge[] = [
  {
    id: 'so-1-evidencia', kind: 'classify', skill: 'sociales.evidencia', difficulty: 1,
    title: 'Sesión 1 · Carril exclusivo para buses',
    scenario: 'El concejo debate si mantener un carril exclusivo para buses. En el debate público se escucharon estas frases.',
    prompt: 'Decide qué frases se pueden verificar con datos y cuáles son opiniones o valoraciones.',
    categories: EVID,
    items: [
      { id: 'a', text: 'El 62 % de los usuarios encuestados por la Secretaría de Movilidad dijo que su viaje en bus tarda menos desde que existe el carril.', answer: 'evidencia' },
      { id: 'b', text: 'El carril exclusivo es una pésima idea.', answer: 'opinion' },
      { id: 'c', text: 'Según el reporte de 2023, el tiempo medio de recorrido de los buses bajó de 48 a 39 minutos.', answer: 'evidencia' },
      { id: 'd', text: 'Los conductores de carros particulares solo piensan en sí mismos.', answer: 'opinion' },
      { id: 'e', text: 'La avenida se ve más ordenada con los carriles pintados.', answer: 'opinion' },
      { id: 'f', text: 'En 2023 se registraron 12 accidentes en el corredor, frente a 19 en 2021.', answer: 'evidencia' },
    ],
    hints: ['Una evidencia verificable tiene cifras, fechas o fuentes que otra persona podría comprobar.', 'Los adjetivos como «pésima» o «más ordenada» expresan una valoración.'],
    explanation: 'Las frases a, c y f aportan datos con fuente o fecha que se pueden comprobar. Las frases b, d y e expresan juicios: nadie puede verificar si algo es «pésimo» u «ordenado». Distinguirlas no significa descartar las opiniones, sino saber cuáles pueden sostener una decisión pública y cuáles necesitan datos.',
  },
  {
    id: 'so-1-instituciones', kind: 'classify', skill: 'sociales.instituciones', difficulty: 1,
    title: 'Sesión 2 · Derechos y mecanismos',
    scenario: 'La Constitución colombiana ofrece varios mecanismos para exigir derechos y participar. Elige el más adecuado para cada situación.',
    prompt: 'Asigna el mecanismo a cada caso.',
    categories: [{ id: 'tutela', label: 'Acción de tutela' }, { id: 'peticion', label: 'Derecho de petición' }, { id: 'veeduria', label: 'Veeduría ciudadana' }, { id: 'cabildo', label: 'Cabildo abierto' }],
    items: [
      { id: 'a', text: 'Una familia pide a la alcaldía copia del contrato de construcción del colegio del barrio.', answer: 'peticion' },
      { id: 'b', text: 'A un joven con una urgencia que pone en riesgo su vida le niegan la atención médica.', answer: 'tutela' },
      { id: 'c', text: 'Vecinos se organizan para vigilar que la obra del acueducto se ejecute como se contrató.', answer: 'veeduria' },
      { id: 'd', text: 'Habitantes de una localidad quieren que el Concejo discuta en sesión pública un proyecto que los afecta.', answer: 'cabildo' },
    ],
    hints: ['Piensa en el objetivo: ¿pedir información, proteger un derecho fundamental urgente, vigilar o debatir?', 'La acción de tutela protege derechos fundamentales cuando están amenazados o vulnerados.'],
    explanation: 'Pedir un documento público es un derecho de petición. Cuando un derecho fundamental (vida, salud) está en riesgo inmediato procede la acción de tutela. Vigilar la ejecución de una obra corresponde a una veeduría ciudadana. Llevar un asunto a discusión pública en una corporación de elección popular es un cabildo abierto.',
  },
  {
    id: 'so-1-budget', kind: 'budget', skill: 'sociales.presupuesto', difficulty: 1,
    title: 'Sesión 3 · Barrio El Mirador',
    scenario: 'Eres el secretario de planeación de un barrio de ladera. Tienes 100 puntos de presupuesto para repartir entre cinco sectores. Debes alcanzar las metas de los indicadores sin exceder los 100 puntos.',
    facts: [{ label: 'Habitantes', value: '38.000' }, { label: 'Hogares sin agua continua', value: '22 %' }, { label: 'Jóvenes de 15 a 24 años que no estudian', value: '31 %' }, { label: 'Tiempo medio al centro de salud', value: '70 min' }],
    weights: W1, goals: G1,
    hints: ['Cada sector aporta con distinto peso a cada indicador (mira la tabla de pesos).', 'Los puntos tienen rendimientos decrecientes: repartir suele rendir más que concentrar todo en un solo sector.', 'Acceso y equidad dependen sobre todo de educación, salud y movilidad.'],
    explanation: `Cada indicador es la suma de los pesos de cada sector por su efecto, y el efecto de un sector sigue 100·p/(p+15): los primeros puntos rinden más que los últimos. Hay muchas distribuciones válidas; por ejemplo: ${example(W1, G1)}. Lo importante es que cumplas las metas respetando el límite, y que puedas justificar por qué priorizas unos sectores según los datos del barrio.`,
  },
  {
    id: 'so-2-decision', kind: 'decision', skill: 'sociales.decision', difficulty: 2,
    title: 'Sesión 4 · El lote de la antigua fábrica',
    scenario: 'El municipio recibió un lote vacío en un sector con pocos servicios. Hay cuatro propuestas. Primero elige el criterio con el que vas a decidir, luego la opción más coherente con ese criterio y, por último, el dato del contexto que más respalda tu decisión. Efectos estimados de −4 a +4.',
    options: [
      { id: 'parque', name: 'Parque-biblioteca', desc: 'Zona verde con biblioteca y salones comunitarios.', effects: { bienestar: 3, equidad: 3, presupuesto: -3, sostenibilidad: 2 } },
      { id: 'salud', name: 'Centro de salud', desc: 'Atención primaria y urgencias básicas.', effects: { bienestar: 4, equidad: 4, presupuesto: -4, sostenibilidad: 0 } },
      { id: 'comercial', name: 'Zona comercial con inversión privada', desc: 'Locales concesionados que pagan arriendo al municipio.', effects: { bienestar: 1, equidad: -1, presupuesto: 4, sostenibilidad: -2 } },
      { id: 'parqueadero', name: 'Parqueadero público', desc: 'Cupos para 300 vehículos con cobro por hora.', effects: { bienestar: 0, equidad: -1, presupuesto: 2, sostenibilidad: -3 } },
    ],
    criteria: [
      { id: 'equidad', label: 'Reducir desigualdades', desc: 'Pesa la equidad (×1) y el bienestar (×0,5).', weights: { equidad: 1, bienestar: 0.5 } },
      { id: 'sostenibilidad', label: 'Cuidar el ambiente', desc: 'Pesa la sostenibilidad (×1) y el bienestar (×0,5).', weights: { sostenibilidad: 1, bienestar: 0.5 } },
      { id: 'fiscal', label: 'Cuidar las finanzas públicas', desc: 'Pesa el efecto en el presupuesto (×1) y el bienestar (×0,5).', weights: { presupuesto: 1, bienestar: 0.5 } },
    ],
    data: [
      { id: 'd1', text: 'El 40 % de los habitantes del sector vive a más de 3 km del centro de salud más cercano.', supports: ['equidad'] },
      { id: 'd2', text: 'El sector tiene 1,2 m² de zona verde por habitante; la recomendación internacional es de 9 m².', supports: ['sostenibilidad'] },
      { id: 'd3', text: 'El presupuesto municipal de este año presenta un déficit del 8 %.', supports: ['fiscal'] },
      { id: 'd4', text: 'El sector tiene la mejor iluminación pública de la ciudad.', supports: [] },
    ],
    hints: ['Calcula el puntaje de cada opción multiplicando sus efectos por los pesos del criterio.', 'Distintos criterios llevan a distintas opciones: no hay una sola respuesta, hay coherencia.', 'El dato debe hablar del mismo asunto que tu criterio.'],
    explanation: 'Con el criterio de equidad gana el centro de salud (4 + 0,5·4 = 6); con sostenibilidad, el parque-biblioteca (2 + 0,5·3 = 3,5); con finanzas, la zona comercial (4 + 0,5·1 = 4,5). Ninguna opción es «la correcta» en absoluto: lo que se evalúa es que la opción elegida sea la mejor según el criterio que declaraste y que cites un dato del escenario que realmente sustente ese criterio. El dato sobre iluminación no respalda ninguno.',
  },
  {
    id: 'so-2-perspectivas', kind: 'classify', skill: 'sociales.perspectivas', difficulty: 2,
    title: 'Sesión 5 · La calle del mercado',
    scenario: 'La alcaldía propone volver peatonal la calle del mercado. En la reunión pública hablaron tres actores: comerciantes del mercado, residentes de la cuadra y la alcaldía.',
    prompt: 'Asigna cada intervención al actor que más probablemente la dijo.',
    categories: [{ id: 'comerciantes', label: 'Comerciantes' }, { id: 'residentes', label: 'Residentes' }, { id: 'alcaldia', label: 'Alcaldía' }],
    items: [
      { id: 'a', text: 'Perdemos clientes si no pueden llegar en carro hasta la puerta.', answer: 'comerciantes' },
      { id: 'b', text: 'El ruido y el humo de los carros no nos dejan dormir ni respirar.', answer: 'residentes' },
      { id: 'c', text: 'Las calles peatonales reducen accidentes y encajan con el plan de movilidad de la ciudad.', answer: 'alcaldia' },
      { id: 'd', text: 'Necesitamos que los camiones puedan descargar la mercancía de madrugada.', answer: 'comerciantes' },
      { id: 'e', text: 'Queremos que los niños puedan jugar en la cuadra sin peligro.', answer: 'residentes' },
      { id: 'f', text: 'La obra se puede financiar con el presupuesto de espacio público de este año.', answer: 'alcaldia' },
    ],
    hints: ['Cada actor habla desde su interés: ingresos, calidad de vida o planificación y recursos.', 'La alcaldía suele hablar de planes, normas y presupuesto.'],
    explanation: 'Los comerciantes se preocupan por el acceso de clientes y la carga de mercancía (a, d); los residentes, por ruido, aire y seguridad de los niños (b, e); la alcaldía, por el plan de movilidad y la financiación (c, f). Los tres intereses son legítimos y entran en tensión: una buena decisión pública busca acuerdos, por ejemplo horarios de descarga, en lugar de dar la razón a uno solo.',
  },
  {
    id: 'so-2-budget', kind: 'budget', skill: 'sociales.presupuesto', difficulty: 2,
    title: 'Sesión 6 · Ciudad con alta informalidad',
    scenario: 'Gobiernas una ciudad intermedia donde el 58 % del empleo es informal y las zonas periféricas están mal conectadas. Debes elevar el acceso y la equidad y cuidar la convivencia con 100 puntos de presupuesto.',
    facts: [{ label: 'Empleo informal', value: '58 %' }, { label: 'Hogares a más de 1 h de un hospital', value: '27 %' }, { label: 'Homicidios por 100.000 hab.', value: '24' }, { label: 'Cobertura de transporte público en la periferia', value: '35 %' }],
    weights: W2, goals: G2,
    hints: ['Aquí la movilidad pesa mucho en el acceso (45 %).', 'La convivencia depende sobre todo de seguridad, pero sube también con educación y espacio público.', 'Es posible cumplir las tres metas, pero con poco margen: revisa los pesos antes de repartir.'],
    explanation: `Como el acceso depende en un 45 % de la movilidad y la equidad en un 40 % de la educación, ambos sectores deben recibir buena parte del presupuesto; la convivencia exige un mínimo en seguridad. Un ejemplo válido es: ${example(W2, G2)}. Existen otras combinaciones; las metas dejan poco margen y obligan a priorizar con criterio.`,
  },
  {
    id: 'so-3-decision', kind: 'decision', skill: 'sociales.decision', difficulty: 3,
    title: 'Sesión 7 · Conectar las laderas',
    scenario: 'Las laderas de la ciudad están mal conectadas con el centro. Evalúa cuatro alternativas con un criterio declarado, la opción coherente y un dato que lo respalde. Efectos estimados de −4 a +4.',
    options: [
      { id: 'cable', name: 'Cable aéreo', desc: 'Línea de cabinas que conecta tres barrios de ladera con el metro.', effects: { bienestar: 3, equidad: 4, presupuesto: -4, sostenibilidad: 2 } },
      { id: 'via', name: 'Ampliar la vía', desc: 'Un carril más para buses y carros particulares.', effects: { bienestar: 1, equidad: 0, presupuesto: -2, sostenibilidad: -3 } },
      { id: 'ciclo', name: 'Ciclorruta y buses eléctricos', desc: 'Corredor ciclista con rutas de buses alimentadores.', effects: { bienestar: 2, equidad: 2, presupuesto: -2, sostenibilidad: 4 } },
      { id: 'nada', name: 'Posponer la decisión un año', desc: 'Esperar a tener un estudio completo y más ingresos.', effects: { bienestar: -1, equidad: -1, presupuesto: 0, sostenibilidad: 0 } },
    ],
    criteria: [
      { id: 'equidad', label: 'Reducir desigualdades', desc: 'Pesa la equidad (×1) y el bienestar (×0,5).', weights: { equidad: 1, bienestar: 0.5 } },
      { id: 'sostenibilidad', label: 'Reducir el impacto ambiental', desc: 'Pesa la sostenibilidad (×1) y el bienestar (×0,5).', weights: { sostenibilidad: 1, bienestar: 0.5 } },
      { id: 'fiscal', label: 'Prudencia fiscal', desc: 'Pesa el efecto en el presupuesto (×1) y el bienestar (×0,5).', weights: { presupuesto: 1, bienestar: 0.5 } },
    ],
    data: [
      { id: 'd1', text: 'Los habitantes de ladera tardan en promedio 95 minutos en llegar al trabajo; el promedio de la ciudad es de 50.', supports: ['equidad'] },
      { id: 'd2', text: 'El transporte genera el 38 % de las emisiones de gases de efecto invernadero de la ciudad.', supports: ['sostenibilidad'] },
      { id: 'd3', text: 'La deuda de la ciudad ya supera el límite legal del 80 % de sus ingresos corrientes.', supports: ['fiscal'] },
      { id: 'd4', text: 'En 2019 se inauguró un nuevo centro comercial en el centro de la ciudad.', supports: [] },
    ],
    hints: ['Calcula primero el puntaje de las cuatro opciones para tu criterio.', 'Con prudencia fiscal, el efecto en el presupuesto pesa más que cualquier beneficio.', 'Elige un dato que hable del mismo problema que tu criterio.'],
    explanation: 'Equidad: el cable aéreo (4 + 0,5·3 = 5,5). Sostenibilidad: ciclorruta y buses eléctricos (4 + 0,5·2 = 5). Prudencia fiscal: posponer la decisión (0 + 0,5·(−1) = −0,5), por encima de la ciclorruta (−2 + 1 = −1). Cada criterio conduce a una opción distinta y todas son defendibles; no se evalúa cuál valor es mejor, sino que tu decisión sea coherente con tu criterio y esté respaldada por un dato pertinente. Posponer también tiene costos que otros criterios pesarían.',
  },
  {
    id: 'so-3-datos', kind: 'classify', skill: 'sociales.datos', difficulty: 3,
    title: 'Sesión 8 · Leer la tabla del censo',
    scenario: 'Una tabla de datos demográficos de cuatro sectores de una ciudad.',
    table: { caption: 'Datos por sector', head: ['Sector', 'Habitantes', 'Hogares con acueducto (%)', 'Colegios públicos'], rows: [['Norte', '48.000', 98, 12], ['Centro', '31.000', 99, 9], ['Ladera', '52.000', 71, 5], ['Río', '27.000', 64, 3]] },
    prompt: 'Decide si cada enunciado se puede deducir solo con la tabla.',
    categories: [{ id: 'si', label: 'Se deduce de la tabla' }, { id: 'no', label: 'No se deduce de la tabla' }],
    items: [
      { id: 'a', text: 'Ladera es el sector con más habitantes.', answer: 'si' },
      { id: 'b', text: 'En Río menos del 70 % de los hogares tiene acueducto.', answer: 'si' },
      { id: 'c', text: 'Ladera tiene menos colegios públicos por habitante que Norte.', answer: 'si' },
      { id: 'd', text: 'La falta de acueducto en Ladera se debe a la pobreza de sus habitantes.', answer: 'no' },
      { id: 'e', text: 'Río es el sector con menor porcentaje de hogares con acueducto.', answer: 'si' },
      { id: 'f', text: 'Si se construyeran más colegios en Río, aumentaría el acceso al acueducto.', answer: 'no' },
    ],
    hints: ['Para comparar «por habitante» divide: colegios entre habitantes.', 'La tabla muestra cifras, no causas ni predicciones.'],
    explanation: 'Se deducen a, b y e (lectura directa) y c (Norte: 12 colegios para 48.000 habitantes ≈ 0,25 por mil; Ladera: 5 para 52.000 ≈ 0,10 por mil). Los enunciados d y f proponen una causa y una predicción: la tabla no contiene datos de ingresos ni de efectos de nuevas obras, así que no pueden deducirse de ella.',
  },
  {
    id: 'so-3-budget', kind: 'budget', skill: 'sociales.presupuesto', difficulty: 3,
    title: 'Sesión 9 · Ciudad en equilibrio',
    scenario: 'Dirige la ciudad completa. Esta vez las metas cubren los cinco indicadores a la vez: ningún sector puede quedarse sin atención y los puntos son limitados.',
    facts: [{ label: 'Déficit de vivienda', value: '14 %' }, { label: 'Cobertura de salud', value: '88 %' }, { label: 'Zonas verdes por habitante', value: '3,1 m²' }, { label: 'Conflictos de convivencia reportados al año', value: '9.400' }],
    weights: W3, goals: G3,
    hints: ['Cuando hay cinco metas a la vez, los sectores con mayor peso en varios indicadores rinden más.', 'Ambiente casi solo influye en sostenibilidad (60 %): necesitas un mínimo suficiente.', 'Comprueba las barras: las metas que fallan se marcan con texto, no solo con color.'],
    explanation: `Con cinco metas simultáneas hay que equilibrar: ambiente es casi el único camino hacia la sostenibilidad, seguridad hacia la convivencia, y educación, salud y movilidad sostienen bienestar, acceso y equidad. Un ejemplo válido es: ${example(W3, G3)}. Existen otras combinaciones que cumplen todas las metas.`,
  },
];
