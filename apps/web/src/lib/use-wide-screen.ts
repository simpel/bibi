import { useSyncExternalStore } from "react";

/** Tailwind's `lg`: wide enough for a side panel beside the page. */
const WIDE = "(min-width: 1024px)";

/** Whether the screen is at least `lg` wide; true on the server, where nothing is measured. */
export function useWideScreen(): boolean {
  return useSyncExternalStore(
    // React hands the store its own listener; the media query calls it on a change.
    (onChange) => {
      const query = window.matchMedia(WIDE);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
}
