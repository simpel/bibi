import type { ResponsibilityDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveResponsibilityAction } from "../actions";

export type ArchiveResponsibilityDialogProps = {
  responsibility: ResponsibilityDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive confirmation on the responsibility's page; it is gone afterwards: back to the list. */
export function ArchiveResponsibilityDialog({
  responsibility,
  open,
  onOpenChange,
}: ArchiveResponsibilityDialogProps) {
  const t = useTranslations("responsibility");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveResponsibilityAction({ id: responsibility.id }),
      messages: { pending: t("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        router.replace(ROUTES.adminResponsibilitiesSection);
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name: responsibility.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
