import { useCallback, useEffect, useRef, useState } from 'react';

/** Cronómetro que cuenta solo el tiempo activo (se detiene en pausa y con la pestaña oculta). */
export function useStopwatch(paused = false) {
  const [sec, setSec] = useState(0);
  const acc = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const id = window.setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      acc.current += 1;
      setSec(acc.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const read = useCallback(() => acc.current, []);
  const reset = useCallback(() => { acc.current = 0; setSec(0); }, []);
  return { sec, read, reset };
}
