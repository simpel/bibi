"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px)";

const subscribe = ({ onChange }: { onChange: () => void }) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/** True from the `md` breakpoint up (docked panel); false on phones (sheet) and during SSR. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe({ onChange }),
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
