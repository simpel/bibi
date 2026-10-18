import type { RequirementDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveRequirementAction } from "../actions";

export type ArchiveRequirementDialogProps = {
  requirement: RequirementDto;
  /** The counted value as shown, e.g. "Allergens: Gluten". */
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Remove confirmation; the ticket page then reloads without the count. */
export function ArchiveRequirementDialog({
  requirement,
  name,
  open,
  onOpenChange,
}: ArchiveRequirementDialogProps) {
  const t = useTranslations("requirement");
  const common = useTranslations("common");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const remove = () =>
    run({
      action: () => archiveRequirementAction({ id: requirement.id }),
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
      description={t("archiveConfirm", { name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={remove}
    />
  );
}
