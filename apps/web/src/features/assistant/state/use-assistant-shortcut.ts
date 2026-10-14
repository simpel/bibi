"use client";

import { useEffect } from "react";

export type UseAssistantShortcutInput = { onToggle: () => void };

/** ⌘J / Ctrl+J toggles the assistant panel from anywhere in the shell. */
export function useAssistantShortcut({ onToggle }: UseAssistantShortcutInput): void {
  useEffect(() => {
    const controller = new AbortController();
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key.toLowerCase() !== "j" || !(event.metaKey || event.ctrlKey)) return;
        event.preventDefault();
        onToggle();
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, [onToggle]);
}
