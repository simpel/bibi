"use client";

import { createContext, useContext } from "react";

/**
 * Tools whose calls the chat does not show as cards, e.g. the first setup's skill loading and
 * previews (ADR 0045), where the page shows the result in plain words instead. Empty by default.
 */
export const QuietToolsContext = createContext<readonly string[]>([]);

export function useQuietTools(): readonly string[] {
  return useContext(QuietToolsContext);
}
