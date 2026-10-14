import type { VocabularyDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveVocabularyAction } from "../actions";

export type ArchiveVocabularyDialogProps = {
  vocabulary: VocabularyDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** On the detail page the list is gone after archiving: go back to the lists. */
  redirectToList?: boolean;
};

/** Archive confirmation; a list still used by a field fails with the conflict toast. */
export function ArchiveVocabularyDialog(props: ArchiveVocabularyDialogProps) {
  const { vocabulary, open, onOpenChange, redirectToList = false } = props;
  const t = useTranslations("vocabulary");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveVocabularyAction({ id: vocabulary.id }),
      messages: { pending: t("archiving"), success: t("archived") },
      onSuccess: () => {
        onOpenChange(false);
        if (redirectToList) router.replace(ROUTES.settingsLists);
        else router.refresh();
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
