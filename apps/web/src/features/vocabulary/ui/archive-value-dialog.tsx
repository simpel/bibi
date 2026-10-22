import type { VocabularyValueDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveValueAction } from "../actions";

export type ArchiveValueDialogProps = {
  value: VocabularyValueDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArchiveValueDialog({ value, open, onOpenChange }: ArchiveValueDialogProps) {
  const t = useTranslations("vocabulary.value");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveValueAction({ id: value.id }),
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
      description={t("archiveConfirm", { name: value.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
