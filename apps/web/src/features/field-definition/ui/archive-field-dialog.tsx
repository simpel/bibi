import type { FieldDefinitionDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveFieldAction } from "../actions";

export type ArchiveFieldDialogProps = {
  field: FieldDefinitionDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive confirmation; a field with values on items fails with the conflict toast. */
export function ArchiveFieldDialog({ field, open, onOpenChange }: ArchiveFieldDialogProps) {
  const t = useTranslations("fieldDefinition");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveFieldAction({ id: field.id }),
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
      description={t("archiveConfirm", { name: field.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
