"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveCommentAction } from "../actions";

export type DeleteCommentDialogProps = {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Delete confirmation; the page then reloads without the comment. */
export function DeleteCommentDialog({ id, open, onOpenChange }: DeleteCommentDialogProps) {
  const t = useTranslations("comment");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const remove = () =>
    run({
      action: () => archiveCommentAction({ id }),
      messages: { pending: common("deleting"), success: t("deleted") },
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("delete")}
      description={t("deleteConfirm")}
      confirmLabel={t("delete")}
      pending={pending}
      onConfirm={remove}
    />
  );
}
