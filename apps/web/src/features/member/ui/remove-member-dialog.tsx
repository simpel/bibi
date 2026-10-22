"use client";

import type { MemberDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { removeMemberAction } from "../actions";

export type RemoveMemberDialogProps = {
  member: MemberDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Confirm → `member.remove` → one toast (CLAUDE.md "Forms", action without fields). */
export function RemoveMemberDialog({ member, open, onOpenChange }: RemoveMemberDialogProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const remove = () =>
    run({
      action: () => removeMemberAction({ id: member.id }),
      messages: { pending: common("removing"), success: t("removed") },
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("remove")}
      description={t("removeConfirm", { name: member.name })}
      confirmLabel={t("remove")}
      pending={pending}
      onConfirm={remove}
    />
  );
}
