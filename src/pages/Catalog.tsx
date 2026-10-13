import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { COMPETENCIES } from '../data/competencies';
import { GAMES } from '../data/games';
import { GameCard } from '../components/GameCard';
import { EmptyState } from '../components/ui';
import { useProgress } from '../store/ProgressContext';
import { bestScore, gameProgressPct, gameStatus } from '../utils/stats';

export default function Catalog() {
  const { progress } = useProgress();
  const [q, setQ] = useState('');
  const [comp, setComp] = useState('todas');
  const [diff, setDiff] = useState('todas');
  const [status, setStatus] = useState('todos');
  const [sort, setSort] = useState('catalogo');

  const list = useMemo(() => {
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let out = GAMES.filter((g) => norm(g.name).includes(norm(q.trim())));
    if (comp !== 'todas') out = out.filter((g) => g.competency === comp);
    if (diff !== 'todas') out = out.filter((g) => String(g.baseDifficulty) === diff);
    if (status !== 'todos') out = out.filter((g) => gameStatus(progress, g.id) === status);
    const by: Record<string, (a: (typeof GAMES)[number], b: (typeof GAMES)[number]) => number> = {
      catalogo: () => 0,
      nombre: (a, b) => a.name.localeCompare(b.name, 'es'),
      dificultad: (a, b) => a.baseDifficulty - b.baseDifficulty,
      mejor: (a, b) => (bestScore(progress, b.id) ?? -1) - (bestScore(progress, a.id) ?? -1),
      progreso: (a, b) => gameProgressPct(progress, b.id) - gameProgressPct(progress, a.id),
    };
    return [...out].sort(by[sort]);
  }, [q, comp, diff, status, sort, progress]);

  const reset = () => { setQ(''); setComp('todas'); setDiff('todas'); setStatus('todos'); setSort('catalogo'); };
  const Select = ({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1 text-xs font-semibold text-muted">{label}
      <select className="field text-ink" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
    </label>
  );

  return (
    <div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Explorar juegos</h1>
      <p className="mt-1 max-w-prose text-muted">Seis minijuegos, cada uno con su propia mecánica. Todos están disponibles; lo que se desbloquea con tu desempeño son los niveles de cada juego.</p>

      <form className="card-pad mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" role="search" aria-label="Filtros del catálogo" onSubmit={(e) => e.preventDefault()}>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted lg:col-span-1">Buscar por nombre
          <span className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
            <input className="field w-full pl-9 text-ink" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: ecosistema" /></span>
        </label>
        <Select label="Competencia" value={comp} onChange={setComp}><option value="todas">Todas</option>{COMPETENCIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Select label="Dificultad" value={diff} onChange={setDiff}><option value="todas">Todas</option><option value="1">Accesible</option><option value="2">Media</option><option value="3">Exigente</option></Select>
        <Select label="Estado" value={status} onChange={setStatus}><option value="todos">Todos</option><option value="nuevo">Nuevos</option><option value="en-progreso">En progreso</option><option value="completado">Completados</option></Select>
        <Select label="Ordenar por" value={sort} onChange={setSort}><option value="catalogo">Orden del catálogo</option><option value="nombre">Nombre</option><option value="dificultad">Dificultad</option><option value="mejor">Mejor puntuación</option><option value="progreso">Progreso</option></Select>
      </form>

      <p className="mt-4 text-sm text-muted" aria-live="polite">{list.length} {list.length === 1 ? 'juego' : 'juegos'}</p>
      {list.length === 0 ? (
        <div className="mt-3"><EmptyState title="Ningún juego coincide" text="Prueba con otra búsqueda o quita algún filtro." action={<button type="button" className="btn-primary" onClick={reset}>Limpiar filtros</button>} /></div>
      ) : (
        <div className="mt-3 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{list.map((g) => <GameCard key={g.id} game={g} progress={progress} />)}</div>
      )}
    </div>
  );
}
