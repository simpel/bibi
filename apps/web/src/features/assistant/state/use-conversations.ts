"use client";

import { useCallback, useState } from "react";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import {
  archiveConversationAction,
  type ConversationSummary,
  listConversationsAction,
  renameConversationAction,
} from "../actions";

/** The user's conversation history (list, rename, archive) through the server actions. `errorKey` is only the list-load failure; rename and archive return their `ActionResult` for the toast helpers. */
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
    if (result.ok) {
      setItems((current) => current.map((item) => (item.id === id ? result.value : item)));
    }
    return result;
  }, []);

  const archive = useCallback(async ({ id }: { id: string }) => {
    const result = await archiveConversationAction({ id });
    if (result.ok) setItems((current) => current.filter((item) => item.id !== id));
    return result;
  }, []);

  return { items, loading, errorKey, refresh, rename, archive };
}
