"use client";

import { useAssistant } from "../state/assistant-context";
import { ConversationRow } from "./conversation-row";
import { RenameConversationForm } from "./rename-conversation-form";

export type EditingConversation = { id: string; mode: "rename" | "archive" } | null;

export type HistoryListProps = {
  editing: EditingConversation;
  onEdit: (editing: EditingConversation) => void;
};

/** The conversation rows; the one being renamed turns into an inline form. */
export function HistoryList({ editing, onEdit }: HistoryListProps) {
  const { conversations, session, selectConversation } = useAssistant();
  return (
    <ul className="grid gap-0.5">
      {conversations.items.map((conversation) => {
        if (editing?.mode === "rename" && editing.id === conversation.id) {
          return (
            <li key={conversation.id}>
              <RenameConversationForm
                title={conversation.title}
                onCancel={() => onEdit(null)}
                onSubmit={async ({ title }) => {
                  if (await conversations.rename({ id: conversation.id, title })) onEdit(null);
                }}
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
