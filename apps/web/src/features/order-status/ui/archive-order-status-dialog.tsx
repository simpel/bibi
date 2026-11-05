import type { OrderStatusDto } from "@bibi/core/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ArchiveOrderStatusForm } from "./archive-order-status-form";

export type ArchiveOrderStatusDialogProps = {
  orderStatus: OrderStatusDto;
  statuses: readonly OrderStatusDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive a status (ADR 0043): a status that holds orders needs a target status for them. */
export function ArchiveOrderStatusDialog({
  orderStatus,
  statuses,
  open,
  onOpenChange,
}: ArchiveOrderStatusDialogProps) {
  const t = useTranslations("orderStatus");
  const targets = statuses.filter(({ id }) => id !== orderStatus.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("archive")}</DialogTitle>
          <DialogDescription>{t("archiveConfirm", { name: orderStatus.name })}</DialogDescription>
        </DialogHeader>
        <ArchiveOrderStatusForm
          status={orderStatus}
          targets={targets}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
