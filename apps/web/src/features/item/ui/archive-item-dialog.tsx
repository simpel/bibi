import type { ItemDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveItemAction } from "../actions";

export type ArchiveItemDialogProps = {
  item: ItemDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive confirmation; the detail page is gone afterwards, so go back to the catalog. */
export function ArchiveItemDialog({ item, open, onOpenChange }: ArchiveItemDialogProps) {
  const t = useTranslations("item");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveItemAction({ id: item.id }),
      messages: { pending: t("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        router.replace(ROUTES.items);
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name: item.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
