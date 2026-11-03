"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { deleteMessagesAction } from "../actions";

export type DeleteMessageDialogProps = {
  /** The messages to delete; null keeps the dialog closed. */
  messages: { id: string; subject: string | null }[] | null;
  onClose: () => void;
  /** After the delete; without it the page refreshes. */
  onDeleted?: () => void;
};

/** Confirms deleting inbox messages (they are archived and leave the inbox for everyone). */
export function DeleteMessageDialog({ messages, onClose, onDeleted }: DeleteMessageDialogProps) {
  const t = useTranslations("inbox");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const count = messages?.length ?? 0;
  const [only] = messages ?? [];
  const confirm = () => {
    if (!messages) return;
    run({
      action: () => deleteMessagesAction({ ids: messages.map(({ id }) => id) }),
      messages: { pending: common("deleting"), success: t("deleted", { count }) },
      onSuccess: () => {
        onClose();
        if (onDeleted) onDeleted();
        else router.refresh();
      },
    });
  };
  return (
    <ConfirmDialog
      open={messages !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t("deleteTitle", { count })}
      description={
        count === 1 && only
          ? t("deleteConfirm", { subject: only.subject ?? t("noSubject") })
          : t("deleteConfirmMany", { count })
      }
      confirmLabel={common("delete")}
      pending={pending}
      onConfirm={confirm}
    />
  );
}
