import { type RefObject, useEffect, useRef } from "react";

export type UseEndInViewInput = {
  /** The element at the end of the list. */
  target: RefObject<HTMLElement | null>;
  /** The scrolling element; the viewport when left out. */
  root?: RefObject<HTMLElement | null>;
  /** Off while a page is loading, after an error or when there is nothing more to read. */
  enabled: boolean;
  /** Reads the next page; the latest one is called, so it need not be stable. */
  onEnd: () => void;
};

/**
 * Infinite scroll: calls `onEnd` once each time the end of a list scrolls into view while
 * `enabled`. Turning `enabled` off and on again (a page loaded) looks again, so a list shorter
 * than its scroller keeps reading until it fills it or runs out.
 */
export function useEndInView({ target, root, enabled, onEnd }: UseEndInViewInput) {
  const latest = useRef(onEnd);
  latest.current = onEnd;
  // IntersectionObserver: a browser API that reports when the end of the list is in view.
  useEffect(() => {
    const element = target.current;
    if (!enabled || !element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        latest.current();
      },
      { root: root?.current ?? null },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, target, root]);
}
