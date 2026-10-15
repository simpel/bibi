import type { CustomerDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveCustomerAction } from "../actions";

export type ArchiveCustomerDialogProps = {
  customer: CustomerDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive confirmation; the detail page is gone afterwards, so go back to the list. */
export function ArchiveCustomerDialog({
  customer,
  open,
  onOpenChange,
}: ArchiveCustomerDialogProps) {
  const t = useTranslations("customer");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveCustomerAction({ id: customer.id }),
      messages: { pending: t("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        router.replace(ROUTES.customers);
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name: customer.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
