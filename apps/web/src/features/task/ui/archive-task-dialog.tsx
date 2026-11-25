"use client";

import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveTaskAction } from "../actions";

export type ArchiveTaskDialogProps = {
  task: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archiving is a task's delete (ADR 0117): confirm, then back to the list. */
export function ArchiveTaskDialog({ task, open, onOpenChange }: ArchiveTaskDialogProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveTaskAction({ id: task.id }),
      messages: { pending: common("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        router.push(ROUTES.tasks);
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name: task.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
