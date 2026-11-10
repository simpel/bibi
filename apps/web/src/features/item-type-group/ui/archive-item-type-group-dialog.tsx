import type { ItemTypeGroupDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveItemTypeGroupAction } from "../actions";

export type ArchiveItemTypeGroupDialogProps = {
  group: ItemTypeGroupDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archiving a group leaves its types without a group, so the dialog says so. */
export function ArchiveItemTypeGroupDialog({
  group,
  open,
  onOpenChange,
}: ArchiveItemTypeGroupDialogProps) {
  const t = useTranslations("itemTypeGroup");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveItemTypeGroupAction({ id: group.id }),
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
      description={t("archiveConfirm", { name: group.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
