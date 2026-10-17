"use client";

import { useAssistant } from "../state/assistant-context";
import { useIsDesktop } from "../state/use-is-desktop";
import { useOnHome } from "../state/use-on-home";
import { AssistantDock } from "./assistant-dock";
import { AssistantSheet } from "./assistant-sheet";

/**
 * The persistent assistant panel of the authenticated shell: docked and resizable from `md` up,
 * a sheet on phones. Only one of them is mounted at a time, and only while it is open. Hidden on
 * the home page, which is the assistant itself (ADR 0035).
 */
export function AssistantPanel() {
  const { open } = useAssistant();
  const desktop = useIsDesktop();
  const onHome = useOnHome();
  if (!open || onHome) return null;
  return desktop ? <AssistantDock /> : <AssistantSheet />;
}
