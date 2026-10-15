import type { PriceListDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archivePriceListAction } from "../actions";

export type ArchivePriceListDialogProps = {
  priceList: PriceListDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArchivePriceListDialog({
  priceList,
  open,
  onOpenChange,
}: ArchivePriceListDialogProps) {
  const t = useTranslations("priceList");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archivePriceListAction({ id: priceList.id }),
      messages: { pending: common("archiving"), success: t("archived") },
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
      description={t("archiveConfirm", { name: priceList.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
