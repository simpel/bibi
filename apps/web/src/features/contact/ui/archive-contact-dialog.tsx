import type { ContactDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveContactAction } from "../actions";

export type ArchiveContactDialogProps = {
  contact: ContactDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive confirmation; the customer page then reloads without the contact person. */
export function ArchiveContactDialog({ contact, open, onOpenChange }: ArchiveContactDialogProps) {
  const t = useTranslations("contact");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveContactAction({ id: contact.id }),
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
      description={t("archiveConfirm", { name: contact.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
