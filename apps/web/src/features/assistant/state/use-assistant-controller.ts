"use client";

import { useCallback, useMemo } from "react";
import type { AssistantContextValue } from "./assistant-context";
import { useAssistantChat } from "./use-assistant-chat";
import { useAssistantShortcut } from "./use-assistant-shortcut";
import { useConversations } from "./use-conversations";
import { usePanelState } from "./use-panel-state";
import { useSessionActions } from "./use-session-actions";

/** Builds the context value: panel state, the chat session and the conversation history. */
export function useAssistantController(): AssistantContextValue {
  const panel = usePanelState();
  const { open, setOpen, view, setView, width, storeWidth, toggle } = panel;
  const conversations = useConversations();
  const { refresh } = conversations;
  const onConversationChanged = useCallback(() => void refresh(), [refresh]);
  const session = useAssistantChat({ onConversationChanged });
  useAssistantShortcut({ onToggle: toggle });
  const actions = useSessionActions({ session, setView, setOpen });
  return useMemo(
    () => ({
      open,
      setOpen: ({ open: next }) => setOpen(next),
      toggle,
      view,
      setView: ({ view: next }) => setView(next),
      width,
      setWidth: ({ width: next }) => storeWidth({ next }),
      session,
      conversations,
      ...actions,
    }),
    [open, toggle, view, width, session, conversations, actions, setOpen, setView, storeWidth],
  );
}
