import type { OccupancyDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveOccupancyAction } from "../actions";

export type ArchiveOccupancyDialogProps = {
  occupancy: OccupancyDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Release confirmation; the item page then reloads without the block. */
export function ArchiveOccupancyDialog({
  occupancy,
  open,
  onOpenChange,
}: ArchiveOccupancyDialogProps) {
  const t = useTranslations("occupancy");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const release = () =>
    run({
      action: () => archiveOccupancyAction({ id: occupancy.id }),
      messages: { pending: t("releasing"), success: t("archived") },
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
      description={t("archiveConfirm")}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={release}
    />
  );
}
