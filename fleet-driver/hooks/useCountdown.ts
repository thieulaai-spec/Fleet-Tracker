import { useState, useEffect } from 'react';

export function useCountdown(deadline?: string) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) { setRemaining(null); return; }
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      setRemaining(diff);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}
