import type { ResponsibilityDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveResponsibilityAction } from "../actions";

export type ArchiveResponsibilityDialogProps = {
  responsibility: ResponsibilityDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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
        router.refresh();
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
