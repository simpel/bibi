import { useEffect } from "react";
import type { LayoutCommands } from "./use-layout-commands";

export type UseEditorKeysInput = {
  commands: LayoutCommands;
  hasSelection: boolean;
  enabled: boolean;
};

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** Shortcuts: arrows move 10 cm (Shift 1 m), R rotates, Ctrl+D duplicates, Delete, undo, redo. */
export function useEditorKeys({ commands, hasSelection, enabled }: UseEditorKeysInput) {
  // Browser API: keyboard shortcuts on the window while the editor is open.
  useEffect(() => {
    if (!enabled) return;
    const onKey = ({ event }: { event: KeyboardEvent }) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [role='dialog'], [role='menu']")) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const arrow = ARROWS[event.key];
      if (mod && key === "z") {
        event.preventDefault();
        if (event.shiftKey) commands.redo();
        else commands.undo();
      } else if (mod && key === "d" && hasSelection) {
        event.preventDefault();
        commands.duplicate();
      } else if ((event.key === "Delete" || event.key === "Backspace") && hasSelection) {
        event.preventDefault();
        commands.remove();
      } else if (key === "r" && !mod && hasSelection) {
        commands.rotate(event.shiftKey ? 15 : 90);
      } else if (event.key === "Escape") {
        commands.select([]);
      } else if (arrow && hasSelection) {
        event.preventDefault();
        const step = event.shiftKey ? 100 : 10;
        commands.move({ dx: arrow[0] * step, dy: arrow[1] * step });
      }
    };
    const listening = new AbortController();
    window.addEventListener("keydown", (event) => onKey({ event }), { signal: listening.signal });
    return () => listening.abort();
  }, [commands, hasSelection, enabled]);
}
