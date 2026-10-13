import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '../App';
import { ProgressProvider } from '../store/ProgressContext';
import { loadProgress } from '../store/progress';
import { GAMES } from '../data/games';
import { LECTURA_CHALLENGES, flatten } from '../games/entre-lineas/data';
import { LOGICA_CHALLENGES } from '../games/protocolo-logico/data';
import { arrangeSolutions } from '../games/protocolo-logico/logic';
import { CHAPTERS } from '../games/context-quest/data';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<ProgressProvider><RouterProvider router={router} /></ProgressProvider>);
  return { router, ...view };
}
const user = () => userEvent.setup();
/** Lee el almacenamiento sin sanear (una partida en curso sigue «started» mientras la pestaña está abierta). */
const raw = () => JSON.parse(localStorage.getItem('mentelab:progress')!);

describe('rutas principales', () => {
  it.each([
    ['/', /Entrena cómo piensas/],
    ['/juegos', /Explorar juegos/],
    ['/entrenamiento', /Entrenamiento personalizado/],
    ['/estadisticas', /Estadísticas/],
    ['/perfil', /Perfil y progreso local/],
    ['/ruta-que-no-existe', /Página no encontrada/],
    ['/juego/no-existe', /Este juego no existe/],
  ])('%s se muestra', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy();
  });

  it('el catálogo filtra por competencia, búsqueda y estado vacío', async () => {
    const u = user();
    renderAt('/juegos');
    expect(screen.getAllByRole('article')).toHaveLength(6);
    await u.selectOptions(screen.getByLabelText('Competencia'), 'matematicas');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Laboratorio numérico' })).toBeTruthy();
    await u.selectOptions(screen.getByLabelText('Competencia'), 'todas');
    await u.type(screen.getByRole('searchbox'), 'zzzz');
    expect(screen.getByText('Ningún juego coincide')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getAllByRole('article')).toHaveLength(6);
    await u.selectOptions(screen.getByLabelText('Estado'), 'completado');
    expect(screen.getByText('Ningún juego coincide')).toBeTruthy();
  });

  it('el entrenamiento muestra el mensaje de datos insuficientes', () => {
    renderAt('/entrenamiento');
    expect(screen.getByText('Aún no hay datos suficientes')).toBeTruthy();
  });
});

describe('cada juego se puede iniciar', () => {
  it.each(GAMES.map((g) => [g.id, g.name]))('%s', async (id, name) => {
    const u = user();
    renderAt(`/juego/${id}`);
    expect(screen.getByRole('heading', { level: 1, name })).toBeTruthy();
    expect(screen.getByText('Cómo se juega')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    expect(screen.getByText(/Desafío 1 de|Chapter 1 ·/)).toBeTruthy();
    expect(raw().sessions[0]).toMatchObject({ gameId: id, status: 'started' });
  });

  it('los niveles 2 y 3 aparecen bloqueados al inicio', () => {
    renderAt('/juego/entre-lineas');
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveProperty('disabled', false);
    expect(radios[1]).toHaveProperty('disabled', true);
    expect(radios[2]).toHaveProperty('disabled', true);
  });
});

describe('partidas completas', () => {
  it('Context Quest: ruta correcta del capítulo 1, resultados y persistencia', async () => {
    const u = user();
    renderAt('/juego/context-quest');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    const chapter = CHAPTERS[0];
    let scene = chapter.scenes.find((s) => s.id === chapter.start)!;
    for (let i = 0; i < 10; i++) {
      const ok = scene.options.find((o) => o.correct)!;
      await u.click(screen.getByRole('radio', { name: new RegExp(ok.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }));
      await u.click(screen.getByRole('button', { name: /Continuar la historia|Terminar la historia/ }));
      if (!ok.next) break;
      scene = chapter.scenes.find((s) => s.id === ok.next)!;
    }
    await u.click(screen.getByRole('button', { name: 'Ver resultados' }));
    expect(screen.getByText('Misión cumplida')).toBeTruthy();
    expect(screen.getByText(/Nuevo nivel desbloqueado/)).toBeTruthy();
    const p = loadProgress().progress; // se guardó en localStorage
    expect(p.sessions[0]).toMatchObject({ status: 'completed', gameId: 'context-quest' });
    expect(p.sessions[0].score).toBeGreaterThanOrEqual(90);
    expect(p.cleared['context-quest']).toEqual([1]);
    expect(p.xp).toBeGreaterThan(0);
    expect(Object.keys(p.achievements)).toContain('primera-victoria');
  });

  it('Context Quest: una respuesta equivocada abre un desvío y se registra', async () => {
    const u = user();
    renderAt('/juego/context-quest');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    await u.click(screen.getByRole('radio', { name: /Wait at Belt 7/ }));
    expect(screen.getByText(/No existe la banda 7/)).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Continuar la historia' }));
    expect(screen.getByText('A friendly stranger')).toBeTruthy();
    expect(screen.getByText('Desvío de la historia')).toBeTruthy();
    expect(loadProgress().progress.sessions[0].records[0]).toMatchObject({ challengeId: 'c1-m1', score: 0, correct: false });
  });

  it('Entre líneas, nivel 1: se resuelve cada tipo de desafío con la solución del contenido', async () => {
    const u = user();
    renderAt('/juego/entre-lineas');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    const level = LECTURA_CHALLENGES.filter((c) => c.difficulty === 1);
    for (const c of level) {
      expect(screen.getByRole('heading', { level: 2, name: c.title })).toBeTruthy();
      if (c.kind === 'select') {
        const sentences = flatten(c.text);
        for (const idx of c.correct) await u.click(screen.getByRole('button', { name: new RegExp(sentences[idx].slice(0, 25).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }));
        await u.click(screen.getByRole('button', { name: 'Entregar deducción' }));
      } else if (c.kind === 'classify') {
        const groups = screen.getAllByRole('radiogroup');
        for (let i = 0; i < c.items.length; i++) {
          const label = c.categories.find((k) => k.id === c.items[i].answer)!.label;
          await u.click(within(groups[i]).getByRole('radio', { name: new RegExp(label.replace(/[()]/g, '\\$&')) }));
        }
        await u.click(screen.getByRole('button', { name: 'Entregar clasificación' }));
      }
      expect(screen.getByText('100 / 100')).toBeTruthy();
      await u.click(screen.getByRole('button', { name: /Siguiente desafío|Ver resultados/ }));
    }
    expect(screen.getByText('Misión cumplida')).toBeTruthy();
    expect(loadProgress().progress.sessions[0].score).toBe(100);
    expect(loadProgress().progress.best['entre-lineas:1']).toBe(100);
  });

  it('Protocolo lógico, nivel 1: secuencia, orden y deducción', async () => {
    const u = user();
    renderAt('/juego/protocolo-logico');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    // 1) secuencia: falta el 24, primero un error
    await u.type(screen.getByLabelText(/Término 5/), '23');
    await u.click(screen.getByRole('button', { name: 'Verificar secuencia' }));
    expect(screen.getByText(/0 de 1 huecos son correctos/)).toBeTruthy();
    await u.clear(screen.getByLabelText(/Término 5/));
    await u.type(screen.getByLabelText(/Término 5/), '24');
    await u.click(screen.getByRole('button', { name: 'Verificar secuencia' }));
    expect(screen.getByText('80 / 100')).toBeTruthy(); // un fallo previo: −20
    await u.click(screen.getByRole('button', { name: 'Siguiente desafío' }));
    // 2) orden: Carla, Diego, Ana, Beto
    const arr = LOGICA_CHALLENGES.find((c) => c.id === 'lg-1-arr');
    if (arr?.kind !== 'arrange') throw new Error('falta');
    const sol = arrangeSolutions(arr.items.map((i) => i.id), arr.clues)[0];
    for (let i = 0; i < sol.length; i++) {
      const label = arr.items.find((x) => x.id === sol[i])!.label;
      await u.click(within(screen.getByRole('group', { name: 'Piezas disponibles' })).getByRole('button', { name: label }));
      await u.click(screen.getByRole('button', { name: new RegExp(`Llegada ${i + 1}:`) }));
    }
    await u.click(screen.getByRole('button', { name: 'Verificar orden' }));
    expect(screen.getByText('100 / 100')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Siguiente desafío' }));
    // 3) deducción: solo «No llovió»
    await u.click(screen.getByRole('checkbox', { name: /^No llovió\./ }));
    await u.click(screen.getByRole('button', { name: 'Verificar conclusiones' }));
    await u.click(screen.getByRole('button', { name: 'Ver resultados' }));
    expect(screen.getByText('Misión cumplida')).toBeTruthy();
    expect(loadProgress().progress.sessions[0].score).toBe(93);
  });
});

describe('salida y reinicio', () => {
  it('salir pide confirmación y registra la partida como abandonada', async () => {
    const u = user();
    const { router } = renderAt('/juego/protocolo-logico');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    await u.click(screen.getByRole('button', { name: 'Salir de la partida' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Seguir jugando' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(raw().sessions[0].status).toBe('started');
    await u.click(screen.getByRole('button', { name: 'Salir de la partida' }));
    await u.click(screen.getByRole('button', { name: 'Salir y abandonar' }));
    expect(router.state.location.pathname).toBe('/juegos');
    const p = loadProgress().progress;
    expect(p.sessions[0].status).toBe('abandoned');
    expect(p.gameStats['protocolo-logico'].abandoned).toBe(1);
  });

  it('navegar con un enlace durante la partida también pide confirmación', async () => {
    const u = user();
    const { router } = renderAt('/juego/entre-lineas');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    await u.click(screen.getAllByRole('link', { name: 'Estadísticas' })[0]);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/juego/entre-lineas');
    await u.click(screen.getByRole('button', { name: 'Salir y abandonar' }));
    expect(router.state.location.pathname).toBe('/estadisticas');
  });

  it('pausa oculta el juego y reanuda', async () => {
    const u = user();
    renderAt('/juego/entre-lineas');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    await u.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(screen.getByText('Partida en pausa')).toBeTruthy();
    expect(screen.queryByText(/Desafío 1 de/)).toBeNull();
    await u.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(screen.getByText(/Desafío 1 de/)).toBeTruthy();
  });

  it('el progreso persiste al «recargar» y reiniciar lo borra con confirmación', async () => {
    const u = user();
    const first = renderAt('/juego/context-quest');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    await u.click(screen.getByRole('radio', { name: /Go to the Service Desk/ }));
    await u.click(screen.getByRole('button', { name: 'Continuar la historia' }));
    first.unmount(); // simula cerrar la pestaña a mitad de partida
    const second = renderAt('/estadisticas');
    expect(await screen.findByText('Historial de partidas')).toBeTruthy();
    expect(screen.getByText('Abandonadas')).toBeTruthy();
    expect(loadProgress().progress.sessions[0].status).toBe('abandoned');
    second.unmount();
    renderAt('/perfil');
    await u.click(screen.getByRole('button', { name: /Reiniciar todo/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(loadProgress().progress.sessions).toHaveLength(1);
    await u.click(screen.getByRole('button', { name: /Reiniciar todo/ }));
    await u.click(screen.getByRole('button', { name: 'Sí, borrar todo' }));
    expect(loadProgress().progress.sessions).toHaveLength(0);
    expect(screen.getByText('Progreso reiniciado.')).toBeTruthy();
  });

  it('exportar genera JSON válido y la importación valida el archivo', async () => {
    const u = user();
    renderAt('/perfil');
    const input = screen.getByLabelText('Archivo de progreso a importar') as HTMLInputElement;
    await u.upload(input, new File(['esto no es json'], 'x.json', { type: 'application/json' }));
    expect(await screen.findByText('El archivo no es un JSON válido.')).toBeTruthy();
    const good = JSON.stringify({ schemaVersion: 1, xp: 250, sessions: [] });
    await u.upload(input, new File([good], 'ok.json', { type: 'application/json' }));
    await u.click(await screen.findByRole('button', { name: 'Importar y reemplazar' }));
    expect(loadProgress().progress.xp).toBe(250);
  });
});
