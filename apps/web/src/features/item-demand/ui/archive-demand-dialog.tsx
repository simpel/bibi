import type { ItemDemandDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveItemDemandAction } from "../actions";

export type ArchiveDemandDialogProps = {
  demand: ItemDemandDto;
  targetName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Removal confirmation; the item page then reloads without the demand. */
export function ArchiveDemandDialog({
  demand,
  targetName,
  open,
  onOpenChange,
}: ArchiveDemandDialogProps) {
  const t = useTranslations("itemDemand");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveItemDemandAction({ id: demand.id }),
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
      description={t("archiveConfirm", { name: targetName })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
