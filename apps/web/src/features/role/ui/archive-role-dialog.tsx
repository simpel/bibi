import type { RoleDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveRoleAction } from "../actions";

export type ArchiveRoleDialogProps = {
  role: RoleDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive confirmation; a role still held by members fails with the conflict error toast. */
export function ArchiveRoleDialog({ role, open, onOpenChange }: ArchiveRoleDialogProps) {
  const t = useTranslations("role");
  const router = useRouter();
  const { pending, run } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveRoleAction({ id: role.id }),
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
      description={t("archiveConfirm", { name: role.name })}
      confirmLabel={t("archive")}
      pending={pending}
      onConfirm={archive}
    />
  );
}
