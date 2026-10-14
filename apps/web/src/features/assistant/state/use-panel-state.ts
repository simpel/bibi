"use client";

import { useCallback, useState } from "react";
import type { AssistantView } from "./assistant-context";
import { DEFAULT_WIDTH, parseWidth } from "./panel-width";
import { useStoredPreference } from "./use-stored-preference";

/** Open/closed, chat-or-history view and the docked width (width is remembered per browser). */
export function usePanelState() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AssistantView>("chat");
  const [width, storeWidth] = useStoredPreference({
    key: "okazi.assistant.width",
    initial: DEFAULT_WIDTH,
    parse: parseWidth,
  });
  const toggle = useCallback(() => setOpen((value) => !value), []);
  return { open, setOpen, view, setView, width, storeWidth, toggle };
}
