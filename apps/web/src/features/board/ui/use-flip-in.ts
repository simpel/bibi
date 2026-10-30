import { useEffect, useRef, useState } from "react";

/** Leave customize mode even if the turn-back never reports its end (e.g. no columns). */
const FALLBACK_MS = 1500;

/**
 * The columns turn over just after customize mode opens, and back before it closes: `flipOut`
 * waits for the board's `onFlipEnd` (GSAP, at once under `prefers-reduced-motion`).
 */
export function useFlipIn() {
  const [flipped, setFlipped] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFlipped(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const finish = () => {
    const onFlipped = pending.current;
    pending.current = null;
    onFlipped?.();
  };
  const flipOut = ({ onFlipped }: { onFlipped: () => void }) => {
    pending.current = onFlipped;
    setFlipped(false);
    window.setTimeout(finish, FALLBACK_MS);
  };
  const onFlipEnd = ({ flipped: now }: { flipped: boolean }) => {
    if (!now) finish();
  };
  return { flipped, flipOut, onFlipEnd };
}
