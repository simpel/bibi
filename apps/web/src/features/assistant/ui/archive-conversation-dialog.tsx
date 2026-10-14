"use client";

import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { ConversationSummary } from "../actions";
import { useAssistant } from "../state/assistant-context";

export type ArchiveConversationDialogProps = {
  /** The conversation to archive; the dialog is open while this is set. */
  conversation: ConversationSummary | undefined;
  onClose: () => void;
};

/** Confirm + archive a conversation; archiving the open one starts a fresh conversation. */
export function ArchiveConversationDialog({
  conversation,
  onClose,
}: ArchiveConversationDialogProps) {
  const t = useTranslations("assistant.history");
  const { conversations, session } = useAssistant();
  const [pending, setPending] = useState(false);
  const confirm = async () => {
    if (!conversation) return;
    setPending(true);
    const archived = await conversations.archive({ id: conversation.id });
    setPending(false);
    if (!archived) return;
    if (conversation.id === session.conversationId) session.startNew();
    toast.success(t("archived"));
    onClose();
  };
  return (
    <ConfirmDialog
      open={conversation !== undefined}
      onOpenChange={(open) => !open && onClose()}
      title={t("archive")}
      description={t("archiveConfirm", { title: conversation?.title ?? "" })}
      confirmLabel={t("archive")}
      pending={pending}
      errorKey={conversations.errorKey}
      onConfirm={() => void confirm()}
    />
  );
}
