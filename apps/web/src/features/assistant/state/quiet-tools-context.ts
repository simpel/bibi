"use client";

import { createContext, useContext } from "react";

/**
 * Tools whose calls the chat does not show as cards, e.g. the first setup's skill loading and
 * previews (ADR 0045), where the page shows the result in plain words instead. Empty by default.
 */
export const QuietToolsContext = createContext<readonly string[]>([]);

/** Tools no chat shows as cards: loading a skill is plumbing, the answer that follows is the result. */
const ALWAYS_QUIET: readonly string[] = ["load_skill"];

export function useQuietTools(): readonly string[] {
  const quiet = useContext(QuietToolsContext);
  return quiet.length === 0 ? ALWAYS_QUIET : [...ALWAYS_QUIET, ...quiet];
}
