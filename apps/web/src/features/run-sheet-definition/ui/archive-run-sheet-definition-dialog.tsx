import type { RunSheetDefinitionDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveRunSheetDefinitionAction } from "../actions";

export type ArchiveRunSheetDefinitionDialogProps = {
  runSheet: RunSheetDefinitionDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveRunSheetDefinitionDialog({
  runSheet,
  open,
  onOpenChange,
}: ArchiveRunSheetDefinitionDialogProps) {
  const t = useTranslations("runSheetDefinition");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveRunSheetDefinitionAction({ id: runSheet.id }),
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
      description={t("archiveConfirm", { name: runSheet.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
