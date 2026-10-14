import type { SetupDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveSetupAction } from "../actions";

export type ArchiveSetupDialogProps = {
  setup: SetupDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveSetupDialog({ setup, open, onOpenChange }: ArchiveSetupDialogProps) {
  const t = useTranslations("setup");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveSetupAction({ id: setup.id }),
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
      description={t("archiveConfirm", { name: setup.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
