import { useCallback, useState } from 'react';

export function useHints(total: number) {
  const [used, setUsed] = useState(0);
  const reveal = useCallback(() => setUsed((u) => Math.min(total, u + 1)), [total]);
  return { used, reveal, canReveal: used < total };
}
