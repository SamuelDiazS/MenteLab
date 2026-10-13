export interface Series { name: string; values: number[]; className: string; dashed?: boolean }

/** Gráfica de líneas en SVG, con tabla accesible equivalente debajo. */
export function LineChart({ series, xLabels, yLabel, xLabel, height = 220, highlight, ariaLabel }: {
  series: Series[];
  xLabels: (string | number)[];
  yLabel: string;
  xLabel: string;
  height?: number;
  highlight?: [number, number];
  ariaLabel: string;
}) {
  const W = 520;
  const H = height;
  const pad = { l: 44, r: 14, t: 12, b: 34 };
  const all = series.flatMap((s) => s.values);
  const min = Math.min(0, ...all);
  const max = Math.max(1, ...all);
  const span = max - min || 1;
  const n = xLabels.length;
  const x = (i: number) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - (v - min) / span) * (H - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => min + t * span);
  const step = Math.max(1, Math.ceil(n / 8));
  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="h-auto w-full">
        {highlight && <rect x={x(highlight[0])} y={pad.t} width={x(highlight[1]) - x(highlight[0])} height={H - pad.t - pad.b} className="fill-brand/15" />}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-muted" fontSize="11">{Math.round(t * 10) / 10}</text>
          </g>
        ))}
        {xLabels.map((l, i) => i % step === 0 && (
          <text key={i} x={x(i)} y={H - 16} textAnchor="middle" className="fill-muted" fontSize="11">{l}</text>
        ))}
        <text x={W / 2} y={H - 2} textAnchor="middle" className="fill-muted" fontSize="11">{xLabel}</text>
        <text x={4} y={10} className="fill-muted" fontSize="11">{yLabel}</text>
        {series.map((s) => (
          <g key={s.name} className={s.className}>
            <polyline fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={s.dashed ? '6 4' : undefined} points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
            {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="currentColor" />)}
          </g>
        ))}
      </svg>
      {series.length > 1 && (
        <figcaption className="mt-1 flex flex-wrap gap-3 text-xs">
          {series.map((s) => (
            <span key={s.name} className={`inline-flex items-center gap-1.5 ${s.className}`}>
              <svg width="22" height="6" aria-hidden="true"><line x1="0" y1="3" x2="22" y2="3" stroke="currentColor" strokeWidth="3" strokeDasharray={s.dashed ? '5 3' : undefined} /></svg>
              <span className="text-ink">{s.name}</span>
            </span>
          ))}
        </figcaption>
      )}
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer">Ver los datos en tabla</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left">
            <thead><tr><th className="pr-3">{xLabel}</th>{series.map((s) => <th key={s.name} className="pr-3">{s.name}</th>)}</tr></thead>
            <tbody>{xLabels.map((l, i) => <tr key={i}><td className="pr-3">{l}</td>{series.map((s) => <td key={s.name} className="pr-3">{Math.round(s.values[i] * 100) / 100}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
