"use client";

import type { OrderTemplateDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveOrderTemplateAction } from "../actions";

export type ArchiveOrderTemplateDialogProps = {
  template: OrderTemplateDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Confirm → server action → one toast; orders already made from the template stay as they are.
 * It opens from the package's page, which is gone afterwards: back to the list.
 */
export function ArchiveOrderTemplateDialog({
  template,
  open,
  onOpenChange,
}: ArchiveOrderTemplateDialogProps) {
  const t = useTranslations("orderTemplate");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveOrderTemplateAction({ id: template.id }),
      messages: { pending: common("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        router.push(ROUTES.packages);
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
