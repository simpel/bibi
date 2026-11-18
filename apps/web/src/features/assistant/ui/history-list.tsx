"use client";

import type { ConversationSummary } from "../actions";
import { useAssistant } from "../state/assistant-context";
import { ConversationRow } from "./conversation-row";
import { RenameConversationForm } from "./rename-conversation-form";

export type EditingConversation = { id: string; mode: "rename" | "archive" } | null;

export type HistoryListProps = {
  editing: EditingConversation;
  onEdit: (editing: EditingConversation) => void;
  /** Lower-case text the titles must contain; empty shows all. */
  query?: string;
};

/** The conversations whose title contains `query` (lower case); all of them when it is empty. */
export function matchConversations({
  items,
  query,
}: {
  items: ConversationSummary[];
  query: string;
}) {
  return query ? items.filter(({ title }) => title.toLocaleLowerCase().includes(query)) : items;
}

/** The conversation rows; the one being renamed turns into an inline form. */
export function HistoryList({ editing, onEdit, query = "" }: HistoryListProps) {
  const { conversations, session, selectConversation } = useAssistant();
  const shown = matchConversations({ items: conversations.items, query });
  return (
    <ul className="grid gap-0.5">
      {shown.map((conversation) => {
        if (editing?.mode === "rename" && editing.id === conversation.id) {
          return (
            <li key={conversation.id}>
              <RenameConversationForm
                conversation={conversation}
                onCancel={() => onEdit(null)}
                onDone={() => onEdit(null)}
              />
            </li>
          );
        }
        return (
          <ConversationRow
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === session.conversationId}
            onOpen={() => void selectConversation({ id: conversation.id })}
            onRename={() => onEdit({ id: conversation.id, mode: "rename" })}
            onArchive={() => onEdit({ id: conversation.id, mode: "archive" })}
          />
        );
      })}
    </ul>
  );
}
