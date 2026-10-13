import { useRef, useState } from 'react';
import { Download, Info, Moon, RotateCcw, Sun, Upload } from 'lucide-react';
import { ACHIEVEMENTS } from '../data/achievements';
import { Icon } from '../components/Icon';
import { ConfirmDialog, ProgressBar } from '../components/ui';
import { useProgress } from '../store/ProgressContext';
import { exportProgress, importProgress } from '../store/progress';
import { levelFromXp } from '../utils/levels';
import { currentStreak } from '../utils/dates';
import { APP_NAME } from '../config';

export default function Profile() {
  const { progress, replace, reset, updateSettings } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState<ReturnType<typeof importProgress> & { ok: true } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const lv = levelFromXp(progress.xp);

  const doExport = () => {
    const blob = new Blob([exportProgress(progress)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentelab-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: 'Copia descargada. Guárdala en un lugar seguro.' });
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 2_000_000) { setMsg({ ok: false, text: 'El archivo es demasiado grande para ser una copia de progreso.' }); return; }
    const res = importProgress(await f.text());
    if (!res.ok) { setMsg({ ok: false, text: res.error }); return; }
    setPending(res);
    if (file.current) file.current.value = '';
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Perfil y progreso local</h1>

      <section className="card-pad mt-5" aria-labelledby="p-lv">
        <h2 id="p-lv" className="text-xl font-bold">Nivel {lv.level}</h2>
        <p className="text-sm text-muted">{progress.xp} XP en total · {lv.current} / {lv.needed} para el nivel {lv.level + 1} · racha de {currentStreak(progress.trainingDays)} día(s)</p>
        <div className="mt-2"><ProgressBar value={lv.pct} label="Experiencia hacia el siguiente nivel" /></div>
        <p className="mt-2 text-xs text-muted">La experiencia viene de jugar y mejorar, no de entrar cada día: la racha solo cuenta días con al menos una partida completada.</p>
      </section>

      <section className="card-pad mt-5" aria-labelledby="p-priv">
        <h2 id="p-priv" className="flex items-center gap-2 text-xl font-bold"><Info className="h-5 w-5" aria-hidden="true" />Dónde se guardan tus datos</h2>
        <p className="reading mt-2 text-sm text-muted">{APP_NAME} no usa cuentas ni servidores. Tu progreso se guarda únicamente en este navegador (almacenamiento local). Si borras los datos del sitio o usas otro navegador u otro dispositivo, empezarás desde cero. No se guarda información personal: solo partidas, puntajes y ajustes. Para llevarte tu avance, exporta una copia.</p>
      </section>

      <section className="card-pad mt-5" aria-labelledby="p-set">
        <h2 id="p-set" className="text-xl font-bold">Ajustes</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-ghost" onClick={() => updateSettings({ theme: progress.settings.theme === 'dark' ? 'light' : 'dark' })} aria-pressed={progress.settings.theme === 'light'}>
            {progress.settings.theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            {progress.settings.theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          </button>
          <label className="flex min-h-[44px] items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--brand))]" checked={progress.settings.showTimer} onChange={(e) => updateSettings({ showTimer: e.target.checked })} />Mostrar cronómetro durante las partidas</label>
        </div>
      </section>

      <section className="card-pad mt-5" aria-labelledby="p-copy">
        <h2 id="p-copy" className="text-xl font-bold">Copia de seguridad</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn-ghost" onClick={doExport}><Download className="h-4 w-4" aria-hidden="true" />Exportar progreso (JSON)</button>
          <button type="button" className="btn-ghost" onClick={() => file.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" />Importar progreso</button>
          <input ref={file} type="file" accept="application/json,.json" className="sr-only" aria-label="Archivo de progreso a importar" tabIndex={-1} onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
        {msg && <p role="status" className={`mt-3 text-sm font-semibold ${msg.ok ? 'text-good' : 'text-bad'}`}>{msg.text}</p>}
      </section>

      <section className="card-pad mt-5" aria-labelledby="p-ach">
        <h2 id="p-ach" className="text-xl font-bold">Logros ({Object.keys(progress.achievements).length} de {ACHIEVEMENTS.length})</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => { const on = !!progress.achievements[a.id]; return (
            <li key={a.id} className={`flex items-start gap-3 rounded-xl p-3 ${on ? 'bg-warn/10' : 'bg-raised/30 opacity-70'}`}><Icon name={a.icon} className={`mt-0.5 h-5 w-5 ${on ? 'text-warn' : 'text-muted'}`} /><div><p className="text-sm font-bold">{a.name} <span className="font-normal text-muted">{on ? '· desbloqueado' : '· bloqueado'}</span></p><p className="text-xs text-muted">{a.description}</p></div></li>
          ); })}
        </ul>
      </section>

      <section className="card-pad mt-5 border-bad/40" aria-labelledby="p-reset">
        <h2 id="p-reset" className="text-xl font-bold">Reiniciar progreso</h2>
        <p className="mt-1 text-sm text-muted">Borra experiencia, estadísticas, logros e historial de este navegador. Tus ajustes se conservan. No se puede deshacer.</p>
        <button type="button" className="btn-danger mt-3" onClick={() => setConfirmReset(true)}><RotateCcw className="h-4 w-4" aria-hidden="true" />Reiniciar todo</button>
      </section>

      <ConfirmDialog open={confirmReset} danger title="¿Reiniciar todo el progreso?" confirmLabel="Sí, borrar todo" onCancel={() => setConfirmReset(false)}
        onConfirm={() => { reset(); setConfirmReset(false); setMsg({ ok: true, text: 'Progreso reiniciado.' }); }} message="Se eliminarán tus partidas, logros, experiencia y estadísticas. Si no tienes una copia exportada, no podrás recuperarlas." />
      <ConfirmDialog open={pending !== null} title="¿Reemplazar tu progreso actual?" confirmLabel="Importar y reemplazar" onCancel={() => setPending(null)}
        onConfirm={() => { if (pending) { replace(pending.progress); setMsg({ ok: true, text: `Progreso importado: ${pending.progress.xp} XP y ${pending.progress.sessions.length} partidas en el historial.` }); } setPending(null); }}
        message={pending ? `El archivo es válido (${pending.progress.xp} XP, ${pending.progress.sessions.length} partidas). Al importarlo se reemplazará el progreso actual de este navegador.` : ''} />
    </div>
  );
}
