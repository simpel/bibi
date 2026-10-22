import type { EntityTypeDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveEntityTypeAction } from "../actions";

export type ArchiveEntityTypeDialogProps = {
  entityType: EntityTypeDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** On the detail page the type is gone after archiving: go back to the list. */
  redirectToList?: boolean;
};

/** Archive confirmation; a type that is still in use fails with the conflict toast. */
export function ArchiveEntityTypeDialog(props: ArchiveEntityTypeDialogProps) {
  const { entityType, open, onOpenChange, redirectToList = false } = props;
  const t = useTranslations("entityType");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveEntityTypeAction({ id: entityType.id }),
      messages: { pending: t("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        if (redirectToList) router.replace(ROUTES.settingsTypes);
        else router.refresh();
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name: entityType.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
