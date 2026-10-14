import { useEffect } from "react";

const SIDEBAR_KEYBOARD_SHORTCUT = "b";

export type UseSidebarShortcutInput = { onToggle: () => void };

export function useSidebarShortcut({ onToggle }: UseSidebarShortcutInput) {
  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== SIDEBAR_KEYBOARD_SHORTCUT || !(event.metaKey || event.ctrlKey)) return;
        event.preventDefault();
        onToggle();
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, [onToggle]);
}
