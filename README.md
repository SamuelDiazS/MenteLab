# MenteLab · Minijuegos para entrenar Saber 11

Plataforma web de seis minijuegos educativos que entrenan las competencias evaluadas en Saber 11. Funciona sin backend, sin cuentas y sin claves: todo el progreso se guarda en el navegador (`localStorage`).

> Proyecto educativo independiente, sin afiliación al ICFES. Los puntajes son internos y **no equivalen** a un puntaje oficial ni predicen el resultado del examen real.

## Requisitos
Node.js 18 o superior.

## Comandos
```bash
npm install        # instala dependencias
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run build      # typecheck + compilación a dist/
npm run preview    # sirve dist/ localmente
npm test           # pruebas (Vitest)
```

## Los seis juegos
| Juego | Competencia | Mecánicas |
|---|---|---|
| Entre líneas | Lectura crítica | Subrayar la tesis, clasificar afirmaciones/evidencias/opiniones, cruzar testimonios, inferir y citar la frase que lo sustenta |
| Protocolo lógico | Razonamiento lógico | Secuencias con reglas ocultas, orden con restricciones, interruptores con condicionales, deducción y contradicciones |
| Laboratorio numérico | Matemáticas | Proporciones, gráficas, presupuesto óptimo, funciones con parámetros, probabilidad, geometría |
| Ecosistema 404 | Ciencias naturales | Hipótesis + simulación (rampa, laguna, depredador-presa, reacción), variables, diseño experimental, datos vs. suposiciones |
| Ciudad en equilibrio | Sociales y ciudadanas | Presupuesto público con indicadores, decisiones con criterios y datos, perspectivas, mecanismos de participación |
| Context Quest | Inglés | Aventura ramificada: avisos, diálogos, mensajes y artículos; las respuestas cambian el rumbo de la historia |

Cada juego tiene 3 niveles. El nivel siguiente se desbloquea al superar el anterior con 60 puntos o más.

## Arquitectura
```
src/
  config.ts              nombre de la plataforma (APP_NAME), umbrales y claves
  types/                 tipos compartidos
  data/                  catálogo de juegos, competencias/habilidades, logros
  utils/                 puntuación, niveles, fechas, estadísticas, recomendador, selección de desafíos
  store/                 persistencia validada (progress.ts), acciones puras (actions.ts), contexto React
  hooks/                 cronómetro y pistas
  components/            Layout, tarjetas, diálogos, iconos
  pages/                 Inicio, Catálogo, Juego (shell), Entrenamiento, Estadísticas, Perfil
  games/
    shared/              ChallengeRunner, retroalimentación, pistas, tablero de clasificación, gráficas, resultados
    <juego>/             data.ts (contenido) · logic.ts / models.ts (reglas verificables) · index.tsx (interfaz)
```

Para añadir un juego: crea su carpeta con un componente que reciba `GameRuntimeProps`, regístralo en `src/games/registry.ts` y añade su ficha en `src/data/games.ts`. El shell se encarga de la pantalla inicial, tutorial, pausa, salida con confirmación, resultados, XP, logros y guardado.

### Sistema común
- Una partida pasa por los estados **iniciada → completada** o **abandonada**. Cada desafío se guarda en cuanto se resuelve. Si se cierra la pestaña a mitad de partida, se carga como abandonada.
- Puntaje de partida (0–100) = promedio de los desafíos. Solo Context Quest añade una bonificación pequeña por rapidez (hasta +10 % del puntaje); en los demás juegos cuenta únicamente la precisión.
- XP = `puntaje/10 × dificultad + 10`. El nivel *L* se alcanza con `100·(L−1)·L/2` XP.
- Entrenamiento personalizado: algoritmo local y transparente (se describe en la propia página). Necesita 3 partidas completadas.
- Las sesiones de refuerzo (desde Entrenamiento) dan XP pero no superan niveles ni modifican récords.

## Guardado local y privacidad
Los datos se validan al cargar, con versión de esquema (`schemaVersion`), valores por defecto, tolerancia a datos corruptos, reinicio con confirmación y exportación/importación de un JSON validado. Si se borran los datos del sitio o se usa otro navegador o dispositivo, el progreso no se conserva.

## Despliegue en Vercel
1. Sube el repositorio a GitHub/GitLab/Bitbucket e impórtalo en Vercel.
2. Vercel detecta Vite: build `npm run build`, salida `dist`. No hay variables de entorno.
3. `vercel.json` redirige las rutas de React a `index.html`, de modo que recargar `/juego/entre-lineas` o `/estadisticas` funciona. Vercel sirve primero los archivos estáticos existentes.

## Pruebas
`npm test` ejecuta 90 pruebas: puntuación y niveles, reglas de cada juego (secuencias, unicidad de las soluciones de los rompecabezas, óptimo de presupuesto contra fuerza bruta, funciones, probabilidades, modelos de simulación, criterios de decisión), integridad del contenido, persistencia y saneamiento de datos, recomendador, y recorridos de interfaz que juegan una partida completa de cada juego.

Limitación conocida: las pruebas de interfaz corren en jsdom, que no calcula estilos ni diseño. La apariencia visual y la responsividad no están cubiertas por pruebas automáticas.
