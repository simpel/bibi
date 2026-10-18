"use client";

import type { TicketTemplateDto } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveTicketTemplateAction } from "../actions";

export type ArchiveTicketTemplateDialogProps = {
  template: TicketTemplateDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Confirm → server action → one toast; tickets already made from the template stay as they are. */
export function ArchiveTicketTemplateDialog({
  template,
  open,
  onOpenChange,
}: ArchiveTicketTemplateDialogProps) {
  const t = useTranslations("ticketTemplate");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveTicketTemplateAction({ id: template.id }),
      messages: { pending: common("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name: template.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
