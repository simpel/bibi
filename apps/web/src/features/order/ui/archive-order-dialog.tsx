import type { OrderDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { archiveOrderAction } from "@/features/lifecycle/actions";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";

export type ArchiveOrderDialogProps = {
  order: OrderDto;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive confirmation on the order's page; it leaves the lists, so go back to them. */
export function ArchiveOrderDialog({ order, name, open, onOpenChange }: ArchiveOrderDialogProps) {
  const t = useTranslations("order");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveOrderAction({ id: order.id }),
      messages: { pending: common("archiving"), success: t("archived") },
      errorMessage: ({ error }) => (error.code === "CONFLICT" ? error.message : null),
      onSuccess: () => {
        onOpenChange(false);
        router.replace(ROUTES.orders);
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
