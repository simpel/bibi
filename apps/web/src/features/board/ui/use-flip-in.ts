import { useEffect, useState } from "react";

const FLIP_MS = 500;

/**
 * The columns turn over just after customize mode opens, and back before it closes. Under
 * `prefers-reduced-motion` the CSS skips the animation and `flipOut` does not wait.
 */
export function useFlipIn() {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFlipped(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const flipOut = ({ onFlipped }: { onFlipped: () => void }) => {
    setFlipped(false);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(onFlipped, reduced ? 0 : FLIP_MS);
  };
  return { flipped, flipOut };
}
