import type { AlternativeGroupDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveAlternativeGroupAction } from "../actions";

export type ArchiveAlternativeGroupDialogProps = {
  group: AlternativeGroupDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Dissolve confirmation: the options become ordinary lines and keep their states. */
export function ArchiveAlternativeGroupDialog({
  group,
  open,
  onOpenChange,
}: ArchiveAlternativeGroupDialogProps) {
  const t = useTranslations("alternativeGroup");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const dissolve = () =>
    run({
      action: () => archiveAlternativeGroupAction({ id: group.id }),
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
      description={t("archiveConfirm", { name: group.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={dissolve}
    />
  );
}
