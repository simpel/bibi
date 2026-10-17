"use client";

import { createContext, useContext } from "react";
import type { ErrorKey } from "@/lib/error-key";
import type { useAssistantChat } from "./use-assistant-chat";
import type { useConversations } from "./use-conversations";
import type { ComposerDraft } from "./use-prefill";

export type AssistantView = "chat" | "history";

export type AssistantContextValue = {
  open: boolean;
  setOpen: (input: { open: boolean }) => void;
  toggle: () => void;
  view: AssistantView;
  setView: (input: { view: AssistantView }) => void;
  width: number;
  setWidth: (input: { width: number }) => void;
  session: ReturnType<typeof useAssistantChat>;
  conversations: ReturnType<typeof useConversations>;
  /** ⌘K hand-off: a fresh conversation with this one question; opens the panel. */
  ask: (input: { text: string }) => void;
  /** A fresh conversation with this text in the message box, not sent; opens the panel. */
  prefill: (input: { text: string }) => void;
  /** The latest prefilled text for the composer. */
  draft: ComposerDraft | null;
  /** Starts an empty conversation (created on the first message). */
  newConversation: () => void;
  /** Opens a stored conversation; resolves to an error key when it cannot be loaded. */
  selectConversation: (input: { id: string }) => Promise<ErrorKey | null>;
};

export const AssistantContext = createContext<AssistantContextValue | null>(null);

/** The assistant state; only valid inside `AssistantProvider` (the authenticated shell). */
export function useAssistant(): AssistantContextValue {
  const value = useContext(AssistantContext);
  if (!value) throw new Error("useAssistant must be used inside AssistantProvider");
  return value;
}
