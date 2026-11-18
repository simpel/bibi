"use client";

import { useEffect, useState } from "react";
import { useAssistant } from "../state/assistant-context";
import type { EditingConversation } from "./history-list";

/** Shared state for a conversation list: loads it, tracks the row being renamed or archived and starts a new chat. */
export function useConversationHistory() {
  const { conversations, newConversation, openAssistant } = useAssistant();
  const { items, loading, errorKey, refresh } = conversations;
  const [editing, setEditing] = useState<EditingConversation>(null);
  useEffect(() => void refresh(), [refresh]);
  const archiving =
    editing?.mode === "archive" ? items.find((item) => item.id === editing.id) : undefined;
  const startNew = () => {
    newConversation();
    openAssistant();
  };
  return { items, loading, errorKey, editing, setEditing, archiving, startNew };
}
