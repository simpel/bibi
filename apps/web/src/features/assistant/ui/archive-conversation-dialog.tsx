"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
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
  const common = useTranslations("common");
  const { conversations, session } = useAssistant();
  const { run, pending } = useToastAction();
  const archive = () => {
    if (!conversation) return;
    run({
      action: () => conversations.archive({ id: conversation.id }),
      messages: { pending: common("archiving"), success: t("archived") },
      onSuccess: () => {
        if (conversation.id === session.conversationId) session.startNew();
        onClose();
      },
    });
  };
  return (
    <ConfirmDialog
      open={conversation !== undefined}
      onOpenChange={(open) => !open && onClose()}
      title={t("archive")}
      description={t("archiveConfirm", { title: conversation?.title ?? "" })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
