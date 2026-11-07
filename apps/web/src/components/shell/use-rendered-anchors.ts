"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Before hydration nothing is known about the page, so no sub-links are drawn. */
const serverSnapshot = () => "";

/**
 * Which of a page's section anchors are on the page right now. A section with nothing to show
 * renders nothing, so the sidebar's sub-links follow the page itself and always match it 1:1.
 */
export function useRenderedAnchors({ anchors }: { anchors: readonly string[] }): string[] {
  const key = anchors.join(" ");
  const snapshot = useCallback(
    () =>
      key
        .split(" ")
        .filter((anchor) => anchor && document.getElementById(anchor))
        .join(" "),
    [key],
  );
  // The page's DOM is the outside system: re-read when sections stream in or leave on navigation.
  const rendered = useSyncExternalStore(
    (notify) => {
      const observer = new MutationObserver(notify);
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    },
    snapshot,
    serverSnapshot,
  );
  return rendered ? rendered.split(" ") : [];
}
