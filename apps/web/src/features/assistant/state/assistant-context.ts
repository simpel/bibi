"use client";

import { createContext, useContext } from "react";
import type { ErrorKey } from "@/lib/error-key";
import type { useAssistantChat } from "./use-assistant-chat";
import type { useConversations } from "./use-conversations";
import type { ComposerDraft } from "./use-prefill";

export type AssistantContextValue = {
  session: ReturnType<typeof useAssistantChat>;
  conversations: ReturnType<typeof useConversations>;
  /** Navigates to the start page, where the assistant lives. */
  goHome: () => void;
  /** ⌘K hand-off: a fresh conversation with this one question; goes to the start page. */
  ask: (input: { text: string }) => void;
  /** A fresh conversation with this text in the message box, not sent; goes to the start page. */
  prefill: (input: { text: string }) => void;
  /** The latest prefilled text for the composer. */
  draft: ComposerDraft | null;
  /** Starts an empty conversation (created on the first message). */
  newConversation: () => void;
  /** Opens a stored conversation on the start page; resolves to an error key when it cannot be loaded. */
  selectConversation: (input: { id: string }) => Promise<ErrorKey | null>;
};

export const AssistantContext = createContext<AssistantContextValue | null>(null);

/** The assistant state; only valid inside `AssistantProvider` (the authenticated shell). */
export function useAssistant(): AssistantContextValue {
  const value = useContext(AssistantContext);
  if (!value) throw new Error("useAssistant must be used inside AssistantProvider");
  return value;
}
