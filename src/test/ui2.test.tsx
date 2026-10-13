import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '../App';
import { ProgressProvider } from '../store/ProgressContext';
import { loadProgress } from '../store/progress';
import { MAT_CHALLENGES } from '../games/laboratorio-numerico/data';
import { extremeInterval, type BudgetItem } from '../games/laboratorio-numerico/logic';
import { CIENCIAS_CHALLENGES } from '../games/ecosistema-404/data';
import { SOCIALES_CHALLENGES } from '../games/ciudad-en-equilibrio/data';
import { findAllocation, SECTORS } from '../games/ciudad-en-equilibrio/logic';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<ProgressProvider><RouterProvider router={router} /></ProgressProvider>);
}

async function solveClassify(u: ReturnType<typeof userEvent.setup>, c: { items: { answer: string }[]; categories: { id: string; label: string }[] }) {
  const groups = screen.getAllByRole('radiogroup');
  for (let i = 0; i < c.items.length; i++) {
    const label = c.categories.find((k) => k.id === c.items[i].answer)!.label;
    await u.click(within(groups[i]).getByRole('radio', { name: new RegExp(`^${esc(label)}$`) }));
  }
}

function bestPurchase(items: BudgetItem[], budget: number) {
  let best: { q: number[]; v: number } = { q: [], v: -1 };
  const rec = (i: number, q: number[], cost: number, v: number) => {
    if (cost > budget) return;
    if (i === items.length) { if (v > best.v) best = { q: q.slice(), v }; return; }
    for (let k = items[i].min; k <= items[i].max; k++) rec(i + 1, [...q, k], cost + k * items[i].price, v + k * items[i].value);
  };
  rec(0, [], 0, 0);
  return best.q;
}

describe('partidas completas (niveles 1)', () => {
  it('Laboratorio numérico: mezcla, gráfica y presupuesto óptimo → 100 puntos', async () => {
    const u = userEvent.setup();
    renderAt('/juego/laboratorio-numerico');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    // 1) razón 2:3:5 con 30 L
    const ratio = MAT_CHALLENGES[0];
    if (ratio.kind !== 'ratio') throw new Error();
    for (const [name, n] of [['Azul', 6], ['Amarillo', 9], ['Blanco', 15]] as const) {
      for (let i = 0; i < n; i++) await u.click(screen.getByRole('button', { name: `Aumentar ${name} (L)` }));
    }
    await u.click(screen.getByRole('button', { name: 'Verificar mezcla' }));
    expect(screen.getByText('100 / 100')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Siguiente desafío' }));
    // 2) intervalo
    const gr = MAT_CHALLENGES[1];
    if (gr.kind !== 'interval') throw new Error();
    const idx = extremeInterval(gr.data, gr.mode);
    await u.click(screen.getByRole('radio', { name: `de ${idx} a ${idx + 1}` }));
    await u.click(screen.getByRole('button', { name: 'Confirmar intervalo' }));
    expect(screen.getByText('100 / 100')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Siguiente desafío' }));
    // 3) presupuesto
    const b = MAT_CHALLENGES[2];
    if (b.kind !== 'budget') throw new Error();
    const q = bestPurchase(b.items, b.budget);
    for (let i = 0; i < b.items.length; i++) for (let k = b.items[i].min; k < q[i]; k++) await u.click(screen.getByRole('button', { name: `Aumentar ${b.items[i].name}` }));
    await u.click(screen.getByRole('button', { name: 'Comprobar compra' }));
    expect(screen.getByText('100 / 100')).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Ver resultados' }));
    expect(screen.getByText('Misión cumplida')).toBeTruthy();
    expect(loadProgress().progress.sessions[0]).toMatchObject({ status: 'completed', score: 100 });
  });

  it('Laboratorio numérico: un error en la mezcla da feedback sin revelar la solución y se puede reintentar', async () => {
    const u = userEvent.setup();
    renderAt('/juego/laboratorio-numerico');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    await u.click(screen.getByRole('button', { name: 'Verificar mezcla' }));
    expect(screen.getByText(/suman 0 L y deben sumar 30/)).toBeTruthy();
    expect(screen.getByText(/Te quedan 2 intentos/)).toBeTruthy();
    expect(screen.queryByText(/Cada parte equivale/)).toBeNull(); // la explicación aún no se muestra
  });

  it('Ecosistema 404: variables, datos y simulación de la rampa → 100 puntos', async () => {
    const u = userEvent.setup();
    renderAt('/juego/ecosistema-404');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    for (let n = 0; n < 2; n++) {
      const c = CIENCIAS_CHALLENGES[n];
      if (c.kind !== 'classify') throw new Error();
      await solveClassify(u, c);
      await u.click(screen.getByRole('button', { name: 'Entregar análisis' }));
      expect(screen.getByText('100 / 100')).toBeTruthy();
      await u.click(screen.getByRole('button', { name: 'Siguiente desafío' }));
    }
    // simulación: no se puede ejecutar sin hipótesis
    expect(screen.getByRole('button', { name: /Ejecutar simulación/ })).toHaveProperty('disabled', true);
    await u.click(screen.getByRole('radio', { name: 'será igual' }));
    fireEvent.change(screen.getByLabelText(/Ángulo de la rampa/), { target: { value: '20' } });
    await u.click(screen.getByRole('button', { name: /Ejecutar simulación/ }));
    expect(screen.getByText(/Ejecuciones: 1 de 5/)).toBeTruthy();
    expect(screen.queryByText('Siguiente desafío')).toBeNull(); // aún no se alcanza la meta
    fireEvent.change(screen.getByLabelText(/Ángulo de la rampa/), { target: { value: '40' } });
    await u.click(screen.getByRole('button', { name: /Ejecutar simulación/ }));
    expect(screen.getByText('100 / 100')).toBeTruthy(); // meta en la 2.ª ejecución + hipótesis correcta
    await u.click(screen.getByRole('button', { name: 'Ver resultados' }));
    expect(screen.getByText('Misión cumplida')).toBeTruthy();
    const p = loadProgress().progress;
    expect(p.sessions[0].score).toBe(100);
    expect(p.skillStats['ciencias.simulacion'].attempts).toBe(1);
  });

  it('Ciudad en equilibrio: opinión/evidencia, mecanismos y presupuesto que cumple las metas', async () => {
    const u = userEvent.setup();
    renderAt('/juego/ciudad-en-equilibrio');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    for (let n = 0; n < 2; n++) {
      const c = SOCIALES_CHALLENGES[n];
      if (c.kind !== 'classify') throw new Error();
      await solveClassify(u, c);
      await u.click(screen.getByRole('button', { name: 'Entregar análisis' }));
      expect(screen.getByText('100 / 100')).toBeTruthy();
      await u.click(screen.getByRole('button', { name: 'Siguiente desafío' }));
    }
    const b = SOCIALES_CHALLENGES[2];
    if (b.kind !== 'budget') throw new Error();
    // un presupuesto vacío no cumple las metas y se indica con texto
    await u.click(screen.getByRole('button', { name: 'Aprobar presupuesto' }));
    expect(screen.getByText(/Cumples 0 de 3 metas/)).toBeTruthy();
    const alloc = findAllocation(b.weights, b.goals)!;
    for (const s of SECTORS) for (let k = 0; k < alloc[s.id] / 5; k++) await u.click(screen.getByRole('button', { name: `Aumentar ${s.label}` }));
    expect(screen.getByText(/Usados: 100 de 100/)).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Aprobar presupuesto' }));
    expect(screen.getByText('80 / 100')).toBeTruthy(); // segundo intento
    await u.click(screen.getByRole('button', { name: 'Ver resultados' }));
    expect(screen.getByText('Misión cumplida')).toBeTruthy();
    expect(loadProgress().progress.sessions[0].score).toBe(93);
  });

  it('el nivel 2 se desbloquea tras superar el nivel 1 y se puede abrir', async () => {
    const u = userEvent.setup();
    renderAt('/juego/context-quest');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    for (const [pick, cont] of [[/Go to the Service Desk/, 'Continuar la historia'], [/To the Maple Hostel/, 'Continuar la historia'], [/To explain the hostel/, 'Terminar la historia']] as const) {
      await u.click(screen.getByRole('radio', { name: pick }));
      await u.click(screen.getByRole('button', { name: cont }));
    }
    await u.click(screen.getByRole('button', { name: 'Ver resultados' }));
    await u.click(screen.getByRole('button', { name: /Siguiente nivel/ }));
    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toHaveProperty('disabled', false);
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    await u.click(screen.getByRole('button', { name: /Comenzar/ }));
    expect(screen.getByText(/Chapter 2 · The City/)).toBeTruthy();
  });
});
