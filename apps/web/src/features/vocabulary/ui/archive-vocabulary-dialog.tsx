import type { VocabularyDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveVocabularyAction } from "../actions";

export type ArchiveVocabularyDialogProps = {
  vocabulary: VocabularyDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Archive confirmation on the list's page, which is gone afterwards: back to the lists. A list
 * still used by a field fails with the conflict toast.
 */
export function ArchiveVocabularyDialog({
  vocabulary,
  open,
  onOpenChange,
}: ArchiveVocabularyDialogProps) {
  const t = useTranslations("vocabulary");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveVocabularyAction({ id: vocabulary.id }),
      messages: { pending: t("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        router.replace(ROUTES.adminLists);
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name: vocabulary.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
