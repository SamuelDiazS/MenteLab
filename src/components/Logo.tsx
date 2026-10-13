export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="-24 -24 48 48" className={className} aria-hidden="true">
      <path d="M0-22 19-11V11L0 22-19 11V-11Z" fill="none" stroke="rgb(var(--brand))" strokeWidth="3" />
      <path d="M0-22 19-11 0 0Z" fill="rgb(var(--c-lectura))" />
      <path d="M19-11V11L0 0Z" fill="rgb(var(--c-matematicas))" />
      <path d="M19 11 0 22 0 0Z" fill="rgb(var(--c-ciencias))" />
      <path d="M0 22-19 11 0 0Z" fill="rgb(var(--c-sociales))" />
      <path d="M-19 11V-11L0 0Z" fill="rgb(var(--c-ingles))" />
      <path d="M-19-11 0-22 0 0Z" fill="rgb(var(--c-logica))" />
    </svg>
  );
}
