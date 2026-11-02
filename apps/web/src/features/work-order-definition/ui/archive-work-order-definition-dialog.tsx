import type { WorkOrderDefinitionDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveWorkOrderDefinitionAction } from "../actions";

export type ArchiveWorkOrderDefinitionDialogProps = {
  workOrder: WorkOrderDefinitionDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveWorkOrderDefinitionDialog({
  workOrder,
  open,
  onOpenChange,
}: ArchiveWorkOrderDefinitionDialogProps) {
  const t = useTranslations("workOrderDefinition");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveWorkOrderDefinitionAction({ id: workOrder.id }),
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
      description={t("archiveConfirm", { name: workOrder.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
