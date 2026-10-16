import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { expireDueOptionsAction } from "../actions";

export type ExpireDueDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

/** Runs `option.expireDue` by hand; the scheduler otherwise does it every 15 minutes. */
export function ExpireDueDialog({ open, onOpenChange }: ExpireDueDialogProps) {
  const t = useTranslations("option");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const expire = () =>
    run({
      action: () => expireDueOptionsAction(),
      messages: { pending: common("saving"), success: t("expired") },
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("expireDue")}
      description={t("expireDueConfirm")}
      confirmLabel={t("expireDue")}
      pending={pending}
      onConfirm={expire}
    />
  );
}
