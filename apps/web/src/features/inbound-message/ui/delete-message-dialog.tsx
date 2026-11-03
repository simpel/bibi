"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { deleteMessageAction } from "../actions";

export type DeleteMessageDialogProps = {
  /** The message to delete; null keeps the dialog closed. */
  message: { id: string; subject: string | null } | null;
  onClose: () => void;
  /** After the delete; without it the page refreshes. */
  onDeleted?: () => void;
};

/** Confirms deleting an inbox message (it is archived and leaves the inbox for everyone). */
export function DeleteMessageDialog({ message, onClose, onDeleted }: DeleteMessageDialogProps) {
  const t = useTranslations("inbox");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const confirm = () => {
    if (!message) return;
    run({
      action: () => deleteMessageAction({ id: message.id }),
      messages: { pending: t("deleting"), success: t("deleted") },
      onSuccess: () => {
        onClose();
        if (onDeleted) onDeleted();
        else router.refresh();
      },
    });
  };
  return (
    <ConfirmDialog
      open={message !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t("delete")}
      description={t("deleteConfirm", { subject: message?.subject ?? t("noSubject") })}
      confirmLabel={t("delete")}
      pending={pending}
      onConfirm={confirm}
    />
  );
}
