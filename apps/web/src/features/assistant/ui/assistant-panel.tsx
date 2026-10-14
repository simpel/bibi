"use client";

import { useAssistant } from "../state/assistant-context";
import { useIsDesktop } from "../state/use-is-desktop";
import { AssistantDock } from "./assistant-dock";
import { AssistantSheet } from "./assistant-sheet";

/**
 * The persistent assistant panel of the authenticated shell: docked and resizable from `md` up,
 * a sheet on phones. Only one of them is mounted at a time, and only while it is open.
 */
export function AssistantPanel() {
  const { open } = useAssistant();
  const desktop = useIsDesktop();
  if (!open) return null;
  return desktop ? <AssistantDock /> : <AssistantSheet />;
}
