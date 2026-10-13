"use client";

import { useEffect } from "react";

export type UseCommandShortcutInput = { onToggle: () => void };

/** ⌘K / Ctrl+K toggles the command bar from anywhere in the shell. */
export function useCommandShortcut({ onToggle }: UseCommandShortcutInput): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      onToggle();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onToggle]);
}
