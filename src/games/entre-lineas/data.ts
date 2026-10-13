import type { BaseChallenge } from '../shared/ChallengeRunner';

/** Texto en párrafos; cada oración tiene un índice global (0, 1, 2…) en orden de lectura. */
export type Paragraphs = string[][];

export interface SelectChallenge extends BaseChallenge {
  kind: 'select';
  doc: string;
  text: Paragraphs;
  prompt: string;
  maxSelect: number;
  correct: number[];
  hints: string[];
}
export interface ClassifyChallenge extends BaseChallenge {
  kind: 'classify';
  doc: string;
  intro: string;
  prompt: string;
  categories: { id: string; label: string }[];
  items: { id: string; text: string; answer: string }[];
  hints: string[];
}
export interface InferenceChallenge extends BaseChallenge {
  kind: 'inference';
  doc: string;
  text: Paragraphs;
  prompt: string;
  options: { id: string; text: string }[];
  correctOption: string;
  /** Oraciones que sustentan la conclusión (se acepta cualquiera de ellas) */
  evidence: number[];
  hints: string[];
}
export type LecturaChallenge = SelectChallenge | ClassifyChallenge | InferenceChallenge;

export const flatten = (t: Paragraphs): string[] => t.flat();

export const LECTURA_CHALLENGES: LecturaChallenge[] = [
  // ───────────── Nivel 1 ─────────────
  {
    id: 'lc-1-tesis', kind: 'select', skill: 'lectura.tesis', difficulty: 1,
    title: 'Caso 1 · La biblioteca de la esquina',
    doc: 'Columna de opinión, periódico barrial',
    text: [[
      'Hace diez años, la biblioteca del barrio Santa Lucía abría seis días a la semana; hoy abre solo dos.',
      'Algunos dicen que nadie la usa porque todo está en internet.',
      'Sin embargo, la biblioteca debe seguir abierta de lunes a sábado, porque es el único lugar del barrio donde un estudiante sin computador puede hacer sus tareas.',
      'En 2023 se registraron 4.200 visitas, y más de la mitad fueron de menores de 18 años.',
      'Cerrarla sería ahorrar unos pesos y perder una oportunidad que no vuelve.',
    ]],
    prompt: 'Toca la oración que expresa la tesis del autor: lo que defiende todo el texto.',
    maxSelect: 1, correct: [2],
    hints: ['La tesis es la postura que el autor quiere que aceptes, no un dato ni una opinión ajena.', 'Busca la oración que dice qué «debe» ocurrir y la razón que la sostiene.'],
    explanation: 'La tesis es la oración 3: el autor sostiene que la biblioteca debe abrir de lunes a sábado y da su razón (es el único lugar con acceso para quien no tiene computador). La oración 2 es una opinión ajena que el autor rebate con «Sin embargo»; la 4 es evidencia (un dato) y la 5 es una consecuencia retórica del argumento.',
  },
  {
    id: 'lc-1-evidencia', kind: 'classify', skill: 'lectura.evidencia', difficulty: 1,
    title: 'Caso 2 · Ciclovía dominical',
    doc: 'Fichas de un debate escolar sobre la ciclovía',
    intro: 'Una estudiante prepara su intervención. Clasifica cada ficha según la función que cumple.',
    prompt: 'Asigna una etiqueta a cada ficha.',
    categories: [{ id: 'afirmacion', label: 'Afirmación (tesis)' }, { id: 'evidencia', label: 'Evidencia (dato)' }, { id: 'opinion', label: 'Opinión sin sustento' }],
    items: [
      { id: 'a', text: 'La ciclovía dominical mejora la salud de los habitantes de la ciudad.', answer: 'afirmacion' },
      { id: 'b', text: 'Según la encuesta distrital, 3 de cada 10 participantes empezaron a hacer ejercicio regular gracias a ella.', answer: 'evidencia' },
      { id: 'c', text: 'Los domingos sin carros son lo más bonito que tiene la ciudad.', answer: 'opinion' },
      { id: 'd', text: 'La medición de 2022 registró 1,6 millones de usuarios en un solo domingo.', answer: 'evidencia' },
      { id: 'e', text: 'Quien no sale a la ciclovía simplemente no sabe divertirse.', answer: 'opinion' },
    ],
    hints: ['Una evidencia se puede verificar: tiene cifras, fuentes o hechos.', 'Una afirmación es lo que se quiere probar; una opinión sin sustento solo expresa gusto o juicio.'],
    explanation: 'La ficha a es la afirmación: lo que se quiere demostrar. Las fichas b y d son evidencias: contienen datos con fuente verificable. Las fichas c y e expresan gustos o juicios personales («lo más bonito», «no sabe divertirse») y no aportan nada que se pueda comprobar.',
  },
  {
    id: 'lc-1-contradiccion', kind: 'select', skill: 'lectura.contradiccion', difficulty: 1,
    title: 'Caso 3 · La cafetería a oscuras',
    doc: 'Testimonios recogidos por la coordinación del colegio',
    text: [
      ['Testimonio de la vigilante: «Cerré la cafetería a las 5:00 p. m. y revisé que la puerta quedara con llave.'],
      ['Testimonio del conserje: «A las 5:30 p. m. entré a trapear y encontré la puerta abierta de par en par.»'],
      ['Testimonio de Camila (grado 10): «A las 6:00 p. m. pasé por el patio y la cafetería estaba oscura.»'],
      ['Testimonio del profesor Ortiz: «Yo salí del colegio a las 4:45 p. m. y no volví a entrar.»'],
      ['Testimonio del vendedor: «Ese día entregué el pan a las 2:00 p. m. y me fui en seguida.»'],
    ],
    prompt: 'Toca las dos declaraciones que no pueden ser verdad al mismo tiempo.',
    maxSelect: 2, correct: [0, 1],
    hints: ['Compara las horas: ¿quién dice haber cerrado y quién encontró abierto después?', 'Dos testimonios se contradicen si aceptar uno obliga a rechazar el otro.'],
    explanation: 'La vigilante asegura que cerró con llave a las 5:00 y el conserje encontró la puerta abierta a las 5:30. Si ambos dicen la verdad, alguien debió abrirla entre las dos horas; pero el texto no lo dice, así que la contradicción real es entre esas dos declaraciones. Camila, el profesor y el vendedor no contradicen a nadie: hablan de otros momentos u otros hechos.',
  },
  // ───────────── Nivel 2 ─────────────
  {
    id: 'lc-2-inferencia', kind: 'inference', skill: 'lectura.inferencia', difficulty: 2,
    title: 'Caso 4 · La finca de don Hernando',
    doc: 'Fragmento narrativo',
    text: [[
      'Don Hernando se levantó antes de que cantara el gallo, como todos los días, pero esta vez no encendió la radio.',
      'Caminó despacio entre los cafetos y se detuvo frente al lote más viejo, donde las ramas colgaban casi vacías.',
      'Arrancó una hoja, la miró a contraluz y la dejó caer sin decir palabra.',
      'En la cocina, doña Rosa apartó el café sin servirle ni preguntar.',
      '—Mañana llamo a Mauricio —dijo él al fin—. Que traiga al técnico de la cooperativa.',
    ]],
    prompt: 'Elige la conclusión que el texto permite inferir y luego toca la oración que más la sostiene.',
    options: [
      { id: 'a', text: 'Don Hernando sospecha que una plaga o enfermedad está afectando el lote viejo.' },
      { id: 'b', text: 'Don Hernando está enojado con su esposa por el café.' },
      { id: 'c', text: 'La cosecha de este año fue la mejor de la finca.' },
      { id: 'd', text: 'Mauricio es el técnico de la cooperativa.' },
    ],
    correctOption: 'a', evidence: [1, 2, 4],
    hints: ['Una inferencia no se dice literalmente, pero el texto la vuelve la explicación más razonable.', 'Fíjate en lo que don Hernando mira, lo que no hace y a quién decide llamar.'],
    explanation: 'La opción a se infiere de varias pistas: el lote viejo tiene ramas «casi vacías» (oración 2), examina la hoja con atención (3) y decide pedir a un técnico (5). La opción b no tiene apoyo: doña Rosa guarda silencio por respeto, no por pelea. La c contradice las ramas vacías. En la d, el texto separa a Mauricio del técnico: «que traiga al técnico».',
  },
  {
    id: 'lc-2-respalda', kind: 'classify', skill: 'lectura.respaldo', difficulty: 2,
    title: 'Caso 5 · ¿Respalda o no respalda?',
    doc: 'Afirmación a evaluar',
    intro: 'Afirmación: «Las jornadas de reciclaje del colegio redujeron la basura que se envía al relleno sanitario.» Decide qué papel cumple cada dato frente a esa afirmación.',
    prompt: 'Asigna una etiqueta a cada dato.',
    categories: [{ id: 'respalda', label: 'Respalda' }, { id: 'debilita', label: 'Debilita' }, { id: 'irrelevante', label: 'No tiene relación' }],
    items: [
      { id: 'a', text: 'Antes de las jornadas, el colegio enviaba 180 kg de residuos por semana al relleno; después, 95 kg.', answer: 'respalda' },
      { id: 'b', text: 'Durante el periodo de las jornadas, el colegio estuvo cerrado seis semanas por obras.', answer: 'debilita' },
      { id: 'c', text: 'El 70 % de los estudiantes prefiere el color verde para las canecas.', answer: 'irrelevante' },
      { id: 'd', text: 'El camión recolector comenzó a pesar los residuos de cada colegio con una báscula calibrada.', answer: 'respalda' },
    ],
    hints: ['Un dato respalda si hace más creíble la afirmación; debilita si ofrece otra explicación posible.', 'Pregúntate: ¿el dato cambiaría mi confianza en que fueron las jornadas las que redujeron la basura?'],
    explanation: 'El dato a compara antes y después con la misma unidad: respalda. El dato d aporta una medición confiable, lo que fortalece la comparación. El dato b debilita: con el colegio cerrado seis semanas, la basura pudo bajar por otra causa. El dato c habla de gustos y no dice nada sobre la cantidad de residuos.',
  },
  {
    id: 'lc-2-tesis-trampa', kind: 'select', skill: 'lectura.tesis', difficulty: 2,
    title: 'Caso 6 · Tareas para la casa',
    doc: 'Editorial de un periódico estudiantil',
    text: [[
      'Se repite que las tareas en casa son indispensables para aprender, y muchos docentes las defienden por costumbre.',
      'Los estudios que se citan para sostenerlo suelen medir el tiempo dedicado, no lo que realmente se aprende.',
      'En cambio, las investigaciones sobre tareas breves y bien diseñadas muestran mejoras reales en comprensión.',
      'Por eso, más que eliminar o aumentar las tareas, los colegios deberían reducir su cantidad y mejorar su diseño.',
      'Una tarea que se hace sin entenderla solo enseña a cumplir.',
    ]],
    prompt: 'Toca la oración que resume lo que el editorial propone.',
    maxSelect: 1, correct: [3],
    hints: ['Cuidado: la primera oración presenta una idea común que el texto va a cuestionar.', 'La tesis suele venir marcada por conectores como «por eso» o «en consecuencia».'],
    explanation: 'La tesis es la oración 4: propone reducir y mejorar las tareas. La 1 expone una creencia ajena; la 2 y la 3 son razones y evidencia que conducen a la propuesta; la 5 es una frase de cierre que ilustra el problema, pero no es la postura central.',
  },
  // ───────────── Nivel 3 ─────────────
  {
    id: 'lc-3-supuesto', kind: 'inference', skill: 'lectura.supuestos', difficulty: 3,
    title: 'Caso 7 · El argumento que no se dice',
    doc: 'Carta al director',
    text: [[
      'Durante el último año, el municipio de Valle Claro instaló cámaras de vigilancia en todas las esquinas del centro.',
      'Los robos a transeúntes en esa zona bajaron un 40 %.',
      'Por lo tanto, instalar cámaras en todos los barrios reducirá el hurto en todo el municipio.',
    ]],
    prompt: 'Elige el supuesto que debe ser cierto para que la conclusión final se sostenga y toca la oración donde el argumento da el salto.',
    options: [
      { id: 'a', text: 'El efecto de las cámaras en el centro se repetiría en los demás barrios.' },
      { id: 'b', text: 'Los ciudadanos de Valle Claro prefieren las cámaras a la policía.' },
      { id: 'c', text: 'Los robos disminuyeron únicamente en el centro del municipio.' },
      { id: 'd', text: 'Las cámaras no cuestan dinero público.' },
    ],
    correctOption: 'a', evidence: [2],
    hints: ['Un supuesto es una idea no declarada que conecta la evidencia con la conclusión.', '¿Qué tendría que ser cierto para pasar del centro a todos los barrios?'],
    explanation: 'El argumento pasa de un resultado en el centro (oración 2) a una predicción general (oración 3). Ese salto solo es válido si lo ocurrido en el centro se repetiría en otros barrios (supuesto a). Los demás supuestos son irrelevantes o contradicen la lógica del texto. Un buen lector detecta además otros huecos: no se descarta que la baja se deba a otras causas.',
  },
  {
    id: 'lc-3-intencion', kind: 'classify', skill: 'lectura.intencion', difficulty: 3,
    title: 'Caso 8 · Mismo hecho, distinta intención',
    doc: 'Cuatro titulares sobre una misma noticia: un nuevo impuesto a las bebidas azucaradas',
    intro: 'Cada titular cuenta el mismo hecho, pero con un propósito distinto. Identifica la intención predominante de cada uno.',
    prompt: 'Asigna una etiqueta a cada titular.',
    categories: [{ id: 'informar', label: 'Informar de forma neutral' }, { id: 'persuadir-a-favor', label: 'Persuadir a favor' }, { id: 'persuadir-en-contra', label: 'Persuadir en contra' }],
    items: [
      { id: 'a', text: 'El Congreso aprobó un impuesto de 18 % a las bebidas con azúcar añadido; entrará en vigencia en enero.', answer: 'informar' },
      { id: 'b', text: 'Por fin: un impuesto que protege la salud de nuestros niños frente a la industria del azúcar.', answer: 'persuadir-a-favor' },
      { id: 'c', text: 'Otro golpe al bolsillo de las familias: el Gobierno castiga hasta la gaseosa del almuerzo.', answer: 'persuadir-en-contra' },
      { id: 'd', text: 'Tras el debate, 62 senadores votaron a favor y 31 en contra del impuesto a las bebidas azucaradas.', answer: 'informar' },
    ],
    hints: ['Las palabras con carga emocional («por fin», «golpe», «castiga») delatan una intención.', 'Un titular informativo responde qué, quién, cuándo y cuánto sin adjetivos valorativos.'],
    explanation: 'Los titulares a y d entregan datos verificables sin adjetivos de valoración. El b usa «por fin» y «protege» para presentarla como algo bueno. El c usa «golpe» y «castiga», palabras que pintan la medida como una agresión. Reconocer la intención no significa que el hecho sea falso, sino que el encuadre busca orientar tu opinión.',
  },
  {
    id: 'lc-3-contradiccion', kind: 'select', skill: 'lectura.contradiccion', difficulty: 3,
    title: 'Caso 9 · El informe del museo',
    doc: 'Extractos de cuatro declaraciones sobre la exposición de cerámica',
    text: [
      ['Directora: «Todas las piezas expuestas fueron halladas en excavaciones de la región del Cauca.»'],
      ['Curador: «La pieza 14, la más antigua, llegó en préstamo desde un museo de Quito.»'],
      ['Guía: «La pieza 14 está expuesta en la sala principal, junto a las demás.»'],
      ['Restauradora: «Ninguna pieza de la sala principal ha sido restaurada.»'],
    ],
    prompt: 'Toca las tres declaraciones que no pueden ser verdad a la vez.',
    maxSelect: 3, correct: [0, 1, 2],
    hints: ['La contradicción aquí involucra tres afirmaciones a la vez, no dos.', 'Sigue la pieza 14: ¿de dónde viene y dónde está?'],
    explanation: 'Si la pieza 14 llegó desde Quito (curador) y está expuesta (guía), entonces hay una pieza expuesta que no fue hallada en el Cauca, lo que contradice a la directora («todas las piezas expuestas»). Ninguna de las tres declaraciones lo hace por sí sola: la contradicción aparece al combinarlas. La declaración de la restauradora no se relaciona con el origen de las piezas.',
  },
];
