"use client";

import type { RoleDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useActionSubmit } from "@/lib/use-action-submit";
import { archiveRoleAction } from "../actions";

export type ArchiveRoleDialogProps = {
  role: RoleDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive confirmation; a role still held by members fails with the conflict error. */
export function ArchiveRoleDialog({ role, open, onOpenChange }: ArchiveRoleDialogProps) {
  const t = useTranslations("role");
  const router = useRouter();
  const { pending, errorKey, run } = useActionSubmit<RoleDto>({
    onSuccess: () => {
      toast.success(t("archived"));
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
      errorKey={errorKey}
      onConfirm={() => run({ action: () => archiveRoleAction({ id: role.id }) })}
    />
  );
}
