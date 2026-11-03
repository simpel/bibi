"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { deleteNotificationsAction } from "../actions";
import { useNotificationLive } from "./notification-live-context";

export type DeleteNotificationsDialogProps = {
  /** The notifications to delete; null keeps the dialog closed. */
  ids: string[] | null;
  onClose: () => void;
};

/** Confirms deleting the caller's own notifications for good, then reads the page again. */
export function DeleteNotificationsDialog({ ids, onClose }: DeleteNotificationsDialogProps) {
  const t = useTranslations("notifications");
  const common = useTranslations("common");
  const router = useRouter();
  const { applyMark } = useNotificationLive();
  const { run, pending } = useToastAction();
  const count = ids?.length ?? 0;
  const confirm = () => {
    if (!ids) return;
    run({
      action: () => deleteNotificationsAction({ ids }),
      messages: { pending: common("deleting"), success: t("deleted", { count }) },
      onSuccess: ({ value }) => {
        applyMark({ ids, read: true, unread: value.unread });
        onClose();
        router.refresh();
      },
    });
  };
  return (
    <ConfirmDialog
      open={ids !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t("deleteTitle", { count })}
      description={t("deleteConfirm", { count })}
      confirmLabel={common("delete")}
      pending={pending}
      onConfirm={confirm}
    />
  );
}
