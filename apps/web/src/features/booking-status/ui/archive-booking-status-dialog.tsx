import type { BookingStatusDto } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveBookingStatusAction } from "../actions";

export type ArchiveBookingStatusDialogProps = {
  status: BookingStatusDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveBookingStatusDialog({
  status,
  open,
  onOpenChange,
}: ArchiveBookingStatusDialogProps) {
  const t = useTranslations("bookingStatus");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveBookingStatusAction({ id: status.id }),
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
      description={t("archiveConfirm", { name: status.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
