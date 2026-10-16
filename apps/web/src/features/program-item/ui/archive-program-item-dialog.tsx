import type { ProgramItemDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveProgramItemAction } from "../actions";

export type ArchiveProgramItemDialogProps = {
  programItem: ProgramItemDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Remove confirmation; the booking page then reloads without the program item. */
export function ArchiveProgramItemDialog({
  programItem,
  open,
  onOpenChange,
}: ArchiveProgramItemDialogProps) {
  const t = useTranslations("programItem");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const remove = () =>
    run({
      action: () => archiveProgramItemAction({ id: programItem.id }),
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
      description={t("archiveConfirm", { name: programItem.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={remove}
    />
  );
}
