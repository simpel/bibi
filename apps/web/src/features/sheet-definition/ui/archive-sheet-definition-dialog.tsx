import type { SheetDefinitionDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveSheetDefinitionAction } from "../actions";

export type ArchiveSheetDefinitionDialogProps = {
  sheet: SheetDefinitionDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveSheetDefinitionDialog({
  sheet,
  open,
  onOpenChange,
}: ArchiveSheetDefinitionDialogProps) {
  const t = useTranslations("sheetDefinition");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveSheetDefinitionAction({ id: sheet.id }),
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
      description={t("archiveConfirm", { name: sheet.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
