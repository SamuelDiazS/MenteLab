import type { Competency, CompetencyId, Skill } from '../types';

export const COMPETENCIES: Competency[] = [
  { id: 'lectura', name: 'Lectura crítica', short: 'Lectura', token: 'c-lectura', description: 'Comprender, evaluar y cuestionar lo que dicen los textos.' },
  { id: 'logica', name: 'Razonamiento lógico', short: 'Lógica', token: 'c-logica', description: 'Descubrir reglas, deducir y detectar contradicciones.' },
  { id: 'matematicas', name: 'Matemáticas', short: 'Matemáticas', token: 'c-matematicas', description: 'Modelar situaciones, interpretar datos y resolver problemas.' },
  { id: 'ciencias', name: 'Ciencias naturales', short: 'Ciencias', token: 'c-ciencias', description: 'Plantear hipótesis, experimentar e interpretar evidencia.' },
  { id: 'sociales', name: 'Sociales y ciudadanas', short: 'Sociales', token: 'c-sociales', description: 'Analizar decisiones públicas, derechos y perspectivas.' },
  { id: 'ingles', name: 'Inglés', short: 'Inglés', token: 'c-ingles', description: 'Comprender el inglés en contexto y actuar con esa información.' },
];

export const competencyById = (id: CompetencyId): Competency => COMPETENCIES.find((c) => c.id === id)!;

export const SKILLS: Skill[] = [
  { id: 'lectura.tesis', label: 'Identificar la tesis', game: 'entre-lineas', practice: 'niveles de tesis y argumento central' },
  { id: 'lectura.evidencia', label: 'Separar afirmaciones, evidencias y opiniones', game: 'entre-lineas', practice: 'clasificación de afirmaciones y evidencias' },
  { id: 'lectura.contradiccion', label: 'Detectar contradicciones', game: 'entre-lineas', practice: 'casos de testimonios contradictorios' },
  { id: 'lectura.inferencia', label: 'Inferir lo no dicho', game: 'entre-lineas', practice: 'casos de inferencias' },
  { id: 'lectura.respaldo', label: 'Juzgar si una evidencia respalda', game: 'entre-lineas', practice: 'evaluación de evidencias' },
  { id: 'lectura.supuestos', label: 'Reconocer supuestos', game: 'entre-lineas', practice: 'análisis de supuestos y argumentos' },
  { id: 'lectura.intencion', label: 'Identificar la intención comunicativa', game: 'entre-lineas', practice: 'intención comunicativa y sesgos' },

  { id: 'logica.secuencias', label: 'Secuencias y reglas ocultas', game: 'protocolo-logico', practice: 'secuencias con reglas ocultas' },
  { id: 'logica.orden', label: 'Orden y restricciones', game: 'protocolo-logico', practice: 'rompecabezas de orden' },
  { id: 'logica.deduccion', label: 'Deducción a partir de premisas', game: 'protocolo-logico', practice: 'deducciones con premisas' },
  { id: 'logica.condicionales', label: 'Condiciones «si… entonces»', game: 'protocolo-logico', practice: 'máquinas con reglas condicionales' },
  { id: 'logica.contradiccion', label: 'Detectar contradicciones lógicas', game: 'protocolo-logico', practice: 'búsqueda de contradicciones' },

  { id: 'matematicas.proporcion', label: 'Razones y proporciones', game: 'laboratorio-numerico', practice: 'problemas de proporciones' },
  { id: 'matematicas.graficas', label: 'Interpretar gráficas', game: 'laboratorio-numerico', practice: 'lectura de gráficas' },
  { id: 'matematicas.optimizacion', label: 'Optimizar con recursos limitados', game: 'laboratorio-numerico', practice: 'problemas de presupuesto y optimización' },
  { id: 'matematicas.funciones', label: 'Funciones y parámetros', game: 'laboratorio-numerico', practice: 'ajuste de funciones' },
  { id: 'matematicas.probabilidad', label: 'Probabilidad', game: 'laboratorio-numerico', practice: 'problemas de probabilidad' },
  { id: 'matematicas.geometria', label: 'Geometría y medición', game: 'laboratorio-numerico', practice: 'problemas de geometría' },

  { id: 'ciencias.variables', label: 'Variables de un experimento', game: 'ecosistema-404', practice: 'identificación de variables' },
  { id: 'ciencias.datos', label: 'Datos frente a suposiciones', game: 'ecosistema-404', practice: 'interpretación de datos experimentales' },
  { id: 'ciencias.diseno', label: 'Diseño experimental', game: 'ecosistema-404', practice: 'diseño de experimentos' },
  { id: 'ciencias.simulacion', label: 'Causa y efecto en sistemas', game: 'ecosistema-404', practice: 'simulaciones de sistemas' },

  { id: 'sociales.evidencia', label: 'Opinión frente a evidencia', game: 'ciudad-en-equilibrio', practice: 'diferenciar opinión y evidencia' },
  { id: 'sociales.instituciones', label: 'Derechos e instituciones', game: 'ciudad-en-equilibrio', practice: 'mecanismos de participación y derechos' },
  { id: 'sociales.presupuesto', label: 'Distribuir recursos públicos', game: 'ciudad-en-equilibrio', practice: 'asignación de presupuesto público' },
  { id: 'sociales.decision', label: 'Evaluar decisiones públicas', game: 'ciudad-en-equilibrio', practice: 'decisiones con criterios explícitos' },
  { id: 'sociales.perspectivas', label: 'Comparar perspectivas', game: 'ciudad-en-equilibrio', practice: 'conflictos de intereses' },
  { id: 'sociales.datos', label: 'Interpretar datos sociales', game: 'ciudad-en-equilibrio', practice: 'lectura de datos demográficos' },

  { id: 'ingles.vocabulario', label: 'Vocabulario en contexto', game: 'context-quest', practice: 'vocabulario en contexto' },
  { id: 'ingles.intencion', label: 'Intención del hablante', game: 'context-quest', practice: 'intención del hablante' },
  { id: 'ingles.conversacion', label: 'Completar conversaciones', game: 'context-quest', practice: 'conversaciones' },
  { id: 'ingles.avisos', label: 'Avisos e instrucciones', game: 'context-quest', practice: 'avisos e instrucciones' },
  { id: 'ingles.idea', label: 'Idea principal y detalles', game: 'context-quest', practice: 'idea principal y detalles' },
];

export const skillById = (id: string): Skill | undefined => SKILLS.find((s) => s.id === id);
export const skillCompetency = (id: string): CompetencyId => id.split('.')[0] as CompetencyId;
