"use client";

import { useEffect } from "react";

export type UseCommandShortcutInput = { onToggle: () => void };

/** ⌘K / Ctrl+K toggles the command bar from anywhere in the shell. */
export function useCommandShortcut({ onToggle }: UseCommandShortcutInput): void {
  useEffect(() => {
    const controller = new AbortController();
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
        event.preventDefault();
        onToggle();
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, [onToggle]);
}
