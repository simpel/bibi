import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveSetupLayoutAction } from "../actions";
import { layoutsRoute } from "../layouts-path";

export type DeleteLayoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  layout: { id: string; name: string };
};

/** Confirms deleting a layout; the page then opens the item's first remaining layout. */
export function DeleteLayoutDialog({
  open,
  onOpenChange,
  itemId,
  layout,
}: DeleteLayoutDialogProps) {
  const t = useTranslations("floorPlan.deleteDialog");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title", { name: layout.name })}
      description={t("description")}
      confirmLabel={t("confirm")}
      pending={pending}
      onConfirm={() =>
        run({
          action: () => archiveSetupLayoutAction({ id: layout.id }),
          messages: { pending: common("archiving"), success: t("deleted") },
          onSuccess: () => {
            onOpenChange(false);
            router.push(layoutsRoute({ itemId }));
          },
        })
      }
    />
  );
}
