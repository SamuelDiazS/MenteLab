import type { Difficulty, SkillId } from '../../types';

export interface Line { who?: string; text: string }
export interface Option { id: string; text: string; correct: boolean; next: string | null; consequence: string }
export interface Scene {
  id: string;
  skill: SkillId;
  title: string;
  kind: 'notice' | 'dialogue' | 'message' | 'article';
  setting: string;
  heading?: string;
  lines: Line[];
  question: string;
  options: Option[];
  gloss: { word: string; meaning: string }[];
  explanation: string;
  detour?: boolean;
}
export interface Chapter {
  difficulty: Difficulty;
  title: string;
  level: string;
  intro: string;
  start: string;
  scenes: Scene[];
  endings: { good: string; ok: string; low: string };
}

export const CHAPTERS: Chapter[] = [
  // ───────────────────────── Capítulo 1 · Llegada (A2) ─────────────────────────
  {
    difficulty: 1, title: 'Chapter 1 · Arrival', level: 'A2',
    intro: 'Luisa, una estudiante de Medellín, aterriza en Toronto para una semana de intercambio. Su maleta no aparece y apenas habla con nadie. Ayúdala a resolver su primer día.',
    start: 'c1-m1',
    endings: {
      good: 'Luisa llegó al hostal con su maleta en camino y el horario del lugar claro. Su primer día fue un éxito.',
      ok: 'Luisa llegó al hostal con algunos tropiezos. Aprendió que leer con calma evita enredos.',
      low: 'El primer día fue caótico, pero Luisa sobrevivió. Repasa los avisos y los mensajes cortos: allí está casi toda la información.',
    },
    scenes: [
      {
        id: 'c1-m1', skill: 'ingles.avisos', title: 'The baggage hall', kind: 'notice',
        setting: 'Luisa espera su maleta, pero la banda se detiene y su equipaje no salió. Ve este aviso en la pared.',
        heading: 'BAGGAGE CLAIM',
        lines: [{ text: 'Belts 1–6 · Arrivals Level 2' }, { text: 'Lost or damaged luggage? Please go to the Service Desk on Level 1.' }, { text: 'Open every day, 6 a.m. – 10 p.m.' }],
        question: 'Luisa’s suitcase did not come out on the belt. What should she do?',
        options: [
          { id: 'a', text: 'Go to the Service Desk on Level 1.', correct: true, next: 'c1-m2', consequence: 'Luisa baja un piso y encuentra el mostrador sin dificultad.' },
          { id: 'b', text: 'Wait at Belt 7 until the bags come.', correct: false, next: 'c1-d1', consequence: 'No existe la banda 7: solo hay de la 1 a la 6. Luisa pierde un buen rato dando vueltas.' },
          { id: 'c', text: 'Come back tomorrow at 6 a.m.', correct: false, next: 'c1-d1', consequence: 'El aviso dice que el mostrador está abierto todos los días hasta las 10 p. m.: puede ir ya. Luisa se queda sin saber qué hacer.' },
        ],
        gloss: [{ word: 'claim', meaning: 'reclamar / recoger' }, { word: 'lost', meaning: 'perdido' }, { word: 'damaged', meaning: 'dañado' }],
        explanation: 'El aviso indica el lugar (Level 1) para equipaje perdido o dañado. Las bandas son de la 1 a la 6, y el mostrador atiende todos los días de 6 a. m. a 10 p. m., así que no hay que esperar al día siguiente.',
      },
      {
        id: 'c1-d1', skill: 'ingles.intencion', title: 'A friendly stranger', kind: 'dialogue', detour: true,
        setting: 'Desvío: Luisa camina confundida y alguien se le acerca.',
        lines: [{ who: 'Man', text: 'Excuse me, miss. You look a little lost. Can I help you?' }, { who: 'Luisa', text: 'Oh… I’m looking for my suitcase.' }],
        question: 'Why does the man speak to Luisa?',
        options: [
          { id: 'a', text: 'He wants to offer her help.', correct: true, next: 'c1-m2', consequence: 'El hombre la lleva hasta el mostrador del Nivel 1.' },
          { id: 'b', text: 'He wants to sell her a suitcase.', correct: false, next: 'c1-m2', consequence: 'Luisa lo ignora y sigue sola; al final encuentra el mostrador, pero tarda mucho más.' },
          { id: 'c', text: 'He wants to know where she is from.', correct: false, next: 'c1-m2', consequence: 'Luisa responde con su país y pierde la oportunidad de recibir ayuda; termina encontrando el mostrador por su cuenta.' },
        ],
        gloss: [{ word: 'lost', meaning: 'perdido / desorientado' }, { word: 'help', meaning: 'ayuda' }],
        explanation: '«You look a little lost. Can I help you?» es una oferta de ayuda: la intención del hablante es ofrecer asistencia, no vender ni preguntar de dónde es.',
      },
      {
        id: 'c1-m2', skill: 'ingles.conversacion', title: 'At the Service Desk', kind: 'dialogue',
        setting: 'Luisa por fin está frente al mostrador de equipaje.',
        lines: [{ who: 'Agent', text: 'Name and flight number, please?' }, { who: 'Luisa', text: 'Luisa Gómez, flight AV 204.' }, { who: 'Agent', text: 'I’m sorry, your bag is still in Bogotá. It will arrive tomorrow morning. Where should we deliver it?' }],
        question: 'Which is the best answer for Luisa?',
        options: [
          { id: 'a', text: 'To the Maple Hostel, 25 King Street, please.', correct: true, next: 'c1-m3', consequence: 'La agente anota la dirección. La maleta llegará al hostal mañana.' },
          { id: 'b', text: 'Yesterday, in the morning.', correct: false, next: 'c1-d2', consequence: 'La agente frunce el ceño: le preguntó «dónde», no «cuándo». Hay que repetir la pregunta.' },
          { id: 'c', text: 'It is a blue suitcase with wheels.', correct: false, next: 'c1-d2', consequence: 'Describir la maleta no responde dónde entregarla. La agente repite la pregunta con paciencia.' },
        ],
        gloss: [{ word: 'deliver', meaning: 'entregar' }, { word: 'flight', meaning: 'vuelo' }, { word: 'bag', meaning: 'bolso / maleta' }],
        explanation: 'La agente pregunta «Where should we deliver it?», es decir, a qué dirección enviar la maleta. Solo la opción a da un lugar. «Yesterday» responde a «when» y la descripción de la maleta responde a «what».',
      },
      {
        id: 'c1-d2', skill: 'ingles.vocabulario', title: 'Don’t worry', kind: 'message', detour: true,
        setting: 'Desvío: la agente escribe una nota para tranquilizar a Luisa.',
        lines: [{ text: 'Don’t worry — this happens often. We will deliver your bag for free, and you will not need to come back to the airport.' }],
        question: 'In this note, “deliver” means…',
        options: [
          { id: 'a', text: 'take something to a place.', correct: true, next: 'c1-m3', consequence: 'Luisa entiende que no tendrá que volver al aeropuerto y se tranquiliza.' },
          { id: 'b', text: 'lose something.', correct: false, next: 'c1-m3', consequence: 'Luisa se asusta pensando que perderán su maleta; pierde tiempo pidiendo aclaraciones.' },
          { id: 'c', text: 'open something.', correct: false, next: 'c1-m3', consequence: 'Luisa no entiende bien la nota y sale preocupada del aeropuerto.' },
        ],
        gloss: [{ word: 'for free', meaning: 'gratis' }, { word: 'often', meaning: 'a menudo' }],
        explanation: 'Por el contexto («for free», «you will not need to come back»), deliver significa llevar algo a un lugar. Las demás opciones no encajan con una nota que busca tranquilizar.',
      },
      {
        id: 'c1-m3', skill: 'ingles.idea', title: 'A message from the hostel', kind: 'message',
        setting: 'En el taxi, Luisa lee el correo del hostal.',
        heading: 'From: Maple Hostel',
        lines: [{ text: 'Hi Luisa! Check-in is from 3 p.m. Breakfast is served from 7 to 9 a.m. in the kitchen on the second floor. Quiet hours start at 10 p.m., so please do not use loud music or lights in the dorm after that. See you soon!' }],
        question: 'What is the main purpose of this message?',
        options: [
          { id: 'a', text: 'To explain the hostel’s schedule and rules.', correct: true, next: null, consequence: 'Luisa sabe a qué hora puede entrar, cuándo desayunar y a qué hora debe hacer silencio.' },
          { id: 'b', text: 'To ask Luisa to pay for breakfast.', correct: false, next: null, consequence: 'El correo no habla de pagos: Luisa se preocupa sin necesidad.' },
          { id: 'c', text: 'To tell Luisa her bag has arrived.', correct: false, next: null, consequence: 'El correo no menciona la maleta. Luisa espera una noticia que no está allí.' },
        ],
        gloss: [{ word: 'check-in', meaning: 'registro de entrada' }, { word: 'quiet hours', meaning: 'horas de silencio' }, { word: 'dorm', meaning: 'dormitorio' }],
        explanation: 'El mensaje enumera horarios (check-in, desayuno) y una norma (silencio desde las 10 p. m.): su propósito es informar sobre el funcionamiento del hostal. No habla de pagos ni de la maleta.',
      },
    ],
  },
  // ───────────────────────── Capítulo 2 · La ciudad (B1) ─────────────────────────
  {
    difficulty: 2, title: 'Chapter 2 · The City', level: 'B1',
    intro: 'Luisa ya se instaló. Hoy debe moverse por la ciudad, pedir un café, visitar un museo y organizar una salida con un amigo.',
    start: 'c2-m1',
    endings: {
      good: 'Luisa recorrió la ciudad con confianza y llegó a tiempo al concierto. Su inglés ya funciona en la calle.',
      ok: 'Luisa logró moverse por la ciudad, con algunos malentendidos graciosos.',
      low: 'La ciudad fue un reto. Practica los avisos y los giros cotidianos: ayudan mucho para entender el contexto.',
    },
    scenes: [
      {
        id: 'c2-m1', skill: 'ingles.avisos', title: 'Route 42 changes', kind: 'notice',
        setting: 'Luisa va a tomar el bus a la universidad y encuentra este aviso en la parada.',
        heading: 'ROUTE 42 — SERVICE CHANGE',
        lines: [{ text: 'From Monday, Route 42 will not stop at King Street because of road works. Please use the temporary stop on Oak Avenue, two blocks north. Buses run every 15 minutes.' }],
        question: 'Luisa lives near King Street. What should she do on Monday?',
        options: [
          { id: 'a', text: 'Walk two blocks north to Oak Avenue to catch the bus.', correct: true, next: 'c2-m2', consequence: 'Luisa llega a Oak Avenue justo a tiempo y consigue sentarse.' },
          { id: 'b', text: 'Wait at King Street; the bus will stop later.', correct: false, next: 'c2-d1', consequence: 'El bus pasa de largo frente a ella. Luisa lo ve alejarse.' },
          { id: 'c', text: 'Take Route 42 only every 15 days.', correct: false, next: 'c2-d1', consequence: 'Confundió «every 15 minutes» con días. Pierde el bus y tendrá que preguntar.' },
        ],
        gloss: [{ word: 'road works', meaning: 'obras en la vía' }, { word: 'two blocks north', meaning: 'dos cuadras al norte' }, { word: 'run', meaning: 'circular / pasar (buses)' }],
        explanation: 'El aviso dice que la ruta no parará en King Street por obras y que debe usarse la parada temporal en Oak Avenue, dos cuadras al norte. «Every 15 minutes» indica la frecuencia, no un plazo en días.',
      },
      {
        id: 'c2-d1', skill: 'ingles.intencion', title: 'The driver', kind: 'dialogue', detour: true,
        setting: 'Desvío: el bus frena un momento y el conductor abre la ventanilla.',
        lines: [{ who: 'Driver', text: 'Sorry, miss, I can’t stop here. Try Oak Avenue — it’s just up the road.' }],
        question: 'What is the driver’s intention?',
        options: [
          { id: 'a', text: 'To tell her where she can take the bus.', correct: true, next: 'c2-m2', consequence: 'Luisa corre hasta Oak Avenue y alcanza el siguiente bus.' },
          { id: 'b', text: 'To ask her to drive the bus.', correct: false, next: 'c2-m2', consequence: 'Luisa se queda confundida; solo logra subir al bus tras caminar un buen rato.' },
          { id: 'c', text: 'To invite her to a restaurant.', correct: false, next: 'c2-m2', consequence: 'Luisa no entiende y se queda parada; finalmente un peatón le indica Oak Avenue.' },
        ],
        gloss: [{ word: 'try', meaning: 'probar / intentar' }, { word: 'up the road', meaning: 'más adelante, por la vía' }],
        explanation: '«I can’t stop here. Try Oak Avenue» es una indicación: el conductor explica por qué no puede detenerse y sugiere otro lugar donde sí podrá subir.',
      },
      {
        id: 'c2-m2', skill: 'ingles.conversacion', title: 'A coffee, please', kind: 'dialogue',
        setting: 'Antes de clase, Luisa pide un café en la cafetería de la universidad.',
        lines: [{ who: 'Barista', text: 'What can I get for you?' }, { who: 'Luisa', text: 'A medium coffee with milk, please. No sugar.' }, { who: 'Barista', text: 'Sure. Anything else?' }],
        question: 'What is the best reply for Luisa if she wants nothing more?',
        options: [
          { id: 'a', text: 'No, thanks. That’s all.', correct: true, next: 'c2-m3', consequence: 'El barista sonríe, cobra el café y Luisa sigue con su día.' },
          { id: 'b', text: 'Yes, I am fine.', correct: false, next: 'c2-d2', consequence: 'El barista no sabe si pide algo más o no. Hay un momento incómodo.' },
          { id: 'c', text: 'I have a coffee, thanks.', correct: false, next: 'c2-d2', consequence: 'El barista cree que ya tiene un café propio y no entiende qué ocurre.' },
        ],
        gloss: [{ word: 'anything else', meaning: '¿algo más?' }, { word: 'sure', meaning: 'claro / por supuesto' }],
        explanation: '«Anything else?» pregunta si quiere algo más; la respuesta natural cuando no quiere nada es «No, thanks. That’s all». Responder «Yes» contradice el mensaje y la opción c no tiene sentido en el diálogo.',
      },
      {
        id: 'c2-d2', skill: 'ingles.intencion', title: 'A short misunderstanding', kind: 'dialogue', detour: true,
        setting: 'Desvío: el barista duda un segundo y mira la fila.',
        lines: [{ who: 'Barista', text: 'Hmm, I’ll take that as a no. Next, please!' }],
        question: 'What does the barista mean?',
        options: [
          { id: 'a', text: 'He understands Luisa doesn’t want anything else.', correct: true, next: 'c2-m3', consequence: 'Luisa recibe su café y se aparta para dejar pasar al siguiente.' },
          { id: 'b', text: 'He is angry because Luisa said no.', correct: false, next: 'c2-m3', consequence: 'Luisa se siente avergonzada sin motivo y casi olvida su café.' },
          { id: 'c', text: 'He wants to give Luisa a free coffee.', correct: false, next: 'c2-m3', consequence: 'Luisa espera un café gratis y se queda esperando en el mostrador.' },
        ],
        gloss: [{ word: 'I’ll take that as…', meaning: 'lo tomaré como… / entiendo que…' }, { word: 'next', meaning: 'siguiente' }],
        explanation: '«I’ll take that as a no» significa «entiendo que es un no». Luego pide al siguiente cliente: no hay enojo ni regalo.',
      },
      {
        id: 'c2-m3', skill: 'ingles.vocabulario', title: 'The museum', kind: 'article',
        setting: 'Por la tarde, Luisa visita el museo de la ciudad y lee el cartel de la nueva exposición.',
        heading: 'NEW EXHIBITION',
        lines: [{ text: 'Our new exhibition is a real eye-opener. It shows how ordinary objects, like spoons and keys, can tell stories about the people who used them, and it invites visitors to look at everyday life in a different way.' }],
        question: 'In this text, “eye-opener” means…',
        options: [
          { id: 'a', text: 'something that shows you new information or ideas.', correct: true, next: 'c2-m4', consequence: 'Luisa entra con curiosidad y sale mirando los objetos cotidianos de otra forma.' },
          { id: 'b', text: 'something that hurts your eyes.', correct: false, next: 'c2-m4', consequence: 'Luisa duda de entrar: se imagina luces muy fuertes. Termina entrando, pero sin mucho entusiasmo.' },
          { id: 'c', text: 'a tool to open boxes.', correct: false, next: 'c2-m4', consequence: 'Luisa pasa de largo pensando que se trata de una exposición de herramientas.' },
        ],
        gloss: [{ word: 'ordinary', meaning: 'común / corriente' }, { word: 'invites', meaning: 'invita' }, { word: 'everyday life', meaning: 'vida cotidiana' }],
        explanation: 'El contexto da la pista: la exposición «muestra cómo los objetos cotidianos cuentan historias» y «invita a mirar la vida cotidiana de otra manera». Un eye-opener es algo que revela algo nuevo y cambia tu forma de ver las cosas; es una expresión figurada.',
      },
      {
        id: 'c2-m4', skill: 'ingles.idea', title: 'A text from Sam', kind: 'message',
        setting: 'Camino a casa, Luisa recibe un mensaje de su amigo Sam.',
        heading: 'Message from Sam',
        lines: [{ text: 'Hey Luisa! Plans changed. The concert is at 8, not 7. I’ll meet you at the metro station at 7:15 and we can walk together. Bring a jacket — it gets cold at night!' }],
        question: 'What changed in the plan?',
        options: [
          { id: 'a', text: 'The time of the concert.', correct: true, next: null, consequence: 'Luisa tiene tiempo de cenar antes de salir. Llega al metro a las 7:15 con su chaqueta.' },
          { id: 'b', text: 'The place of the concert.', correct: false, next: null, consequence: 'Luisa llega a otro lugar creyendo que cambió el sitio y casi se pierde el inicio.' },
          { id: 'c', text: 'The weather forecast.', correct: false, next: null, consequence: 'Luisa se concentra en el clima y no se da cuenta del cambio de hora.' },
        ],
        gloss: [{ word: 'plans changed', meaning: 'los planes cambiaron' }, { word: 'bring', meaning: 'trae' }],
        explanation: '«The concert is at 8, not 7» marca el cambio: la hora, no el lugar. El comentario sobre la chaqueta es un consejo y no una modificación del plan.',
      },
    ],
  },
  // ───────────────────────── Capítulo 3 · El festival (B1+) ─────────────────────────
  {
    difficulty: 3, title: 'Chapter 3 · The Festival', level: 'B1+',
    intro: 'Último fin de semana. Luisa se ofrece como voluntaria en el festival de linternas del pueblo vecino. Allí deberá entender un artículo, tomar decisiones y escribir a casa.',
    start: 'c3-m1',
    endings: {
      good: 'Luisa ayudó en el festival, entendió hasta los matices y escribió a casa con orgullo: el inglés ya es suyo.',
      ok: 'Luisa disfrutó del festival aunque se perdió algunos matices. Con un poco más de práctica los captará.',
      low: 'El festival fue un reto de matices. Practica la idea principal y las expresiones figuradas: dan pistas que van más allá de las palabras.',
    },
    scenes: [
      {
        id: 'c3-m1', skill: 'ingles.idea', title: 'The lantern festival', kind: 'article',
        setting: 'En el tren, Luisa lee un artículo local sobre el festival al que va.',
        heading: 'Riverside Lantern Festival',
        lines: [{ text: 'Every October, the town of Riverside holds a lantern festival. What began in 1998 as a small neighbourhood event has grown into a three-day celebration that attracts over 20,000 visitors. Volunteers make the lanterns from recycled paper in workshops open to anyone. Critics say the crowds have damaged the riverbank, and organisers have responded by limiting the number of tickets and adding a shuttle bus.' }],
        question: 'Which statement best expresses the main idea of the article?',
        options: [
          { id: 'a', text: 'A small local festival has grown a lot, and organisers are trying to manage its effects.', correct: true, next: 'c3-m2', consequence: 'Luisa llega al pueblo entendiendo la historia del festival y por qué hay límites de entradas.' },
          { id: 'b', text: 'The festival is held in October because the weather is good.', correct: false, next: 'c3-d1', consequence: 'El artículo no habla del clima. Luisa llega con una idea equivocada del festival.' },
          { id: 'c', text: 'Critics want to end the festival and organisers agree.', correct: false, next: 'c3-d1', consequence: 'Los organizadores no están de acuerdo con acabarlo: lo que hacen es limitar el impacto. Luisa se confunde.' },
        ],
        gloss: [{ word: 'grown into', meaning: 'se ha convertido en' }, { word: 'attracts', meaning: 'atrae' }, { word: 'riverbank', meaning: 'orilla del río' }, { word: 'shuttle bus', meaning: 'bus lanzadera' }],
        explanation: 'El artículo cuenta que un evento pequeño creció mucho (20.000 visitantes), que hay críticas por daños en la orilla y que los organizadores respondieron limitando entradas y agregando un bus. La idea principal une crecimiento y gestión de sus efectos. Las otras opciones añaden información que el texto no contiene.',
      },
      {
        id: 'c3-d1', skill: 'ingles.intencion', title: 'A volunteer’s note', kind: 'message', detour: true,
        setting: 'Desvío: al llegar, Luisa encuentra esta nota pegada en el tablero de voluntarios.',
        lines: [{ text: 'Not that I’m complaining, but the paper-lantern workshop was supposed to start at 10, and it’s now 10:40. Is someone coming to explain what to do?' }],
        question: 'What is the writer’s intention?',
        options: [
          { id: 'a', text: 'To politely show annoyance about the delay.', correct: true, next: 'c3-m2', consequence: 'Luisa entiende el ambiente y se ofrece a ayudar mientras llega el responsable.' },
          { id: 'b', text: 'To say that the workshop was cancelled forever.', correct: false, next: 'c3-m2', consequence: 'Luisa se va creyendo que no hay taller y pierde la oportunidad de ayudar.' },
          { id: 'c', text: 'To thank the organisers for being on time.', correct: false, next: 'c3-m2', consequence: 'Luisa se queda confundida: la nota habla de un retraso, no de puntualidad.' },
        ],
        gloss: [{ word: 'not that I’m complaining', meaning: 'no es que me queje (pero…)' }, { word: 'supposed to', meaning: 'se suponía que' }, { word: 'delay', meaning: 'retraso' }],
        explanation: '«Not that I’m complaining, but…» suele anticipar una queja suave. El dato «supposed to start at 10, and it’s now 10:40» confirma que el autor señala un retraso de manera cortés.',
      },
      {
        id: 'c3-m2', skill: 'ingles.conversacion', title: 'A favour at the desk', kind: 'dialogue',
        setting: 'La organizadora le pide ayuda a Luisa, pero ella ya tiene un plan por la tarde.',
        lines: [{ who: 'Organiser', text: 'We’re short of volunteers for Saturday. Would you be able to help at the information desk?' }, { who: 'Luisa', text: '(Luisa wants to help, but she has a tour booked at 2 p.m.)' }],
        question: 'Which reply is the most appropriate for Luisa?',
        options: [
          { id: 'a', text: 'I’d love to, but I have a tour at 2. Could I help in the morning?', correct: true, next: 'c3-m3', consequence: 'La organizadora le asigna el turno de la mañana y Luisa puede hacer su tour.' },
          { id: 'b', text: 'Yes, I hate the information desk.', correct: false, next: 'c3-m3', consequence: 'La organizadora se sorprende por la respuesta tan seca y cambia de voluntario.' },
          { id: 'c', text: 'The tour is on the second floor.', correct: false, next: 'c3-m3', consequence: 'La respuesta no tiene relación con la pregunta; la organizadora sigue buscando a otra persona.' },
        ],
        gloss: [{ word: 'short of', meaning: 'escasos de' }, { word: 'would you be able to…?', meaning: '¿podrías…? (petición cortés)' }, { word: 'booked', meaning: 'reservado' }],
        explanation: 'Se pide un favor con una fórmula cortés. La mejor respuesta acepta con entusiasmo, explica el conflicto y propone una alternativa (turno de mañana). Las otras opciones son descorteses o no responden a la petición.',
      },
      {
        id: 'c3-m3', skill: 'ingles.avisos', title: 'Lantern rules', kind: 'notice',
        setting: 'En la entrada del festival hay un cartel con las normas. Luisa debe ayudar a los visitantes.',
        heading: 'LANTERN PICK-UP',
        lines: [{ text: 'Tickets must be shown at the entrance.' }, { text: 'Children under 12 must be accompanied by an adult.' }, { text: 'Lanterns with real candles are not allowed. Electric lights are provided free of charge.' }],
        question: 'A father arrives with his 9-year-old son and two lanterns with real candles. What will the staff most likely tell him?',
        options: [
          { id: 'a', text: 'The boy may enter with him, but the candles are not allowed.', correct: true, next: 'c3-m4', consequence: 'El padre entrega las velas y recibe luces eléctricas. Entra con su hijo sin problema.' },
          { id: 'b', text: 'The boy must wait outside, but the candles are fine.', correct: false, next: 'c3-d2', consequence: 'Luisa da la información al revés, y el padre se enoja. Un compañero interviene.' },
          { id: 'c', text: 'Neither can come in because they have no tickets.', correct: false, next: 'c3-d2', consequence: 'El cartel dice que deben mostrar la entrada, no que no tengan. Luisa se apresura sin motivo.' },
        ],
        gloss: [{ word: 'accompanied', meaning: 'acompañado' }, { word: 'not allowed', meaning: 'no permitido' }, { word: 'free of charge', meaning: 'gratis' }],
        explanation: 'Hay que aplicar las normas a la situación. Un niño menor de 12 puede entrar acompañado por un adulto (su padre). Las velas reales no están permitidas, pero se ofrecen luces eléctricas gratis. Es una inferencia a partir de varias reglas.',
      },
      {
        id: 'c3-d2', skill: 'ingles.intencion', title: 'Politely, but firmly', kind: 'dialogue', detour: true,
        setting: 'Desvío: un compañero voluntario se acerca para ayudar con el malentendido.',
        lines: [{ who: 'Staff member', text: 'I’m afraid I’ll have to ask you to leave the candles with me, sir. Here are two electric lanterns instead.' }],
        question: 'What does the staff member mean?',
        options: [
          { id: 'a', text: 'He is politely refusing to allow the candles.', correct: true, next: 'c3-m4', consequence: 'El padre acepta, y la tensión baja. Luisa aprende el tono con el que se dan malas noticias.' },
          { id: 'b', text: 'He is afraid of the candles and runs away.', correct: false, next: 'c3-m4', consequence: 'Luisa malinterpreta «I’m afraid» y casi se ríe; el compañero la mira sorprendido.' },
          { id: 'c', text: 'He wants to buy the candles from the visitor.', correct: false, next: 'c3-m4', consequence: 'Luisa cree que es una compra y complica la conversación con el visitante.' },
        ],
        gloss: [{ word: 'I’m afraid (that)…', meaning: 'lamento / me temo que…' }, { word: 'instead', meaning: 'en su lugar' }],
        explanation: '«I’m afraid I’ll have to ask you…» es una fórmula cortés para dar una mala noticia: aquí no expresa miedo. La frase siguiente («Here are two electric lanterns instead») confirma que las velas no pasan y ofrece una alternativa.',
      },
      {
        id: 'c3-m4', skill: 'ingles.vocabulario', title: 'A message home', kind: 'message',
        setting: 'La noche del festival, Luisa escribe a su mamá.',
        heading: 'To: Mum',
        lines: [{ text: 'Dear Mum, the festival was even better than I expected. I thought I’d be bored carrying a lantern for two hours, but when thousands of lights began to float down the river, nobody spoke. It felt as if the whole town was holding its breath.' }],
        question: 'What does Luisa mean by “nobody spoke… holding its breath”?',
        options: [
          { id: 'a', text: 'People were so moved that they stayed silent.', correct: true, next: null, consequence: 'Luisa guarda ese momento como su recuerdo favorito de la semana.' },
          { id: 'b', text: 'People were angry about the noise.', correct: false, next: null, consequence: 'Luisa no transmite la emoción de la escena a su madre.' },
          { id: 'c', text: 'The air near the river was dangerous to breathe.', correct: false, next: null, consequence: 'La expresión era figurada: nadie tuvo problemas para respirar.' },
        ],
        gloss: [{ word: 'bored', meaning: 'aburrido' }, { word: 'float', meaning: 'flotar' }, { word: 'hold one’s breath', meaning: 'contener la respiración' }],
        explanation: '«Holding its breath» es una expresión figurada que describe el silencio y la expectación de una multitud ante algo impresionante. El inicio del mensaje («even better than I expected») confirma que fue una experiencia positiva, no de enojo ni de peligro.',
      },
    ],
  },
];

export const mainSceneCount = (c: Chapter) => c.scenes.filter((s) => !s.detour).length;
