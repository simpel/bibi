"use client";

import { useCallback, useState } from "react";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import {
  archiveConversationAction,
  type ConversationSummary,
  listConversationsAction,
  renameConversationAction,
} from "../actions";

/** The user's conversation history (list, rename, archive) through the server actions. */
export function useConversations() {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await listConversationsAction();
    setLoading(false);
    setErrorKey(result.ok ? null : errorKeyForCode({ code: result.error.code }));
    if (result.ok) setItems(result.value);
  }, []);

  const rename = useCallback(async ({ id, title }: { id: string; title: string }) => {
    const result = await renameConversationAction({ id, title });
    setErrorKey(result.ok ? null : errorKeyForCode({ code: result.error.code }));
    if (result.ok) {
      setItems((current) => current.map((item) => (item.id === id ? result.value : item)));
    }
    return result.ok;
  }, []);

  const archive = useCallback(async ({ id }: { id: string }) => {
    const result = await archiveConversationAction({ id });
    setErrorKey(result.ok ? null : errorKeyForCode({ code: result.error.code }));
    if (result.ok) setItems((current) => current.filter((item) => item.id !== id));
    return result.ok;
  }, []);

  return { items, loading, errorKey, refresh, rename, archive };
}
