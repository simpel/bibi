import type { LineDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveLineAction } from "../actions";

export type ArchiveLineDialogProps = {
  line: LineDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Remove confirmation; the ticket page then reloads without the line. */
export function ArchiveLineDialog({ line, open, onOpenChange }: ArchiveLineDialogProps) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const remove = () =>
    run({
      action: () => archiveLineAction({ id: line.id }),
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
      description={t("archiveConfirm", { name: line.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={remove}
    />
  );
}
