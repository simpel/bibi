"use client";

import type { MemberDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { removeMemberAction } from "../actions";

export type RemoveMemberButtonProps = { member: MemberDto };

/** Confirm → `member.remove` → one toast (CLAUDE.md "Forms", action without fields). */
export function RemoveMemberButton({ member }: RemoveMemberButtonProps) {
  const t = useTranslations("member");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { run, pending } = useToastAction();
  const remove = () =>
    run({
      action: () => removeMemberAction({ id: member.id }),
      messages: { pending: common("removing"), success: t("removed") },
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t("remove")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("remove")}
        description={t("removeConfirm", { name: member.name })}
        confirmLabel={t("remove")}
        pending={pending}
        onConfirm={remove}
      />
    </>
  );
}
