import { useEffect, useRef } from "react";

/**
 * A free-running tick. The callback is held in a ref so changing it does not
 * restart the interval — restarting on every render would make the clock jitter
 * and the phase display lie.
 */
export function useClock(running: boolean, hz: number, onTick: () => void): void {
  const cb = useRef(onTick);
  cb.current = onTick;
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => cb.current(), 1000 / hz);
    return () => clearInterval(id);
  }, [running, hz]);
}
