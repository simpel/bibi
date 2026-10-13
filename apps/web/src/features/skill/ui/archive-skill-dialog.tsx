"use client";

import type { SkillDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ROUTES } from "@/lib/routes";
import { useActionSubmit } from "@/lib/use-action-submit";
import { archiveSkillAction } from "../actions";

export type ArchiveSkillDialogProps = {
  skill: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Confirm + archive; the skill disappears from the list, so go back to it. */
export function ArchiveSkillDialog({ skill, open, onOpenChange }: ArchiveSkillDialogProps) {
  const t = useTranslations("skills");
  const router = useRouter();
  const { pending, errorKey, run } = useActionSubmit<SkillDto>({
    onSuccess: () => {
      toast.success(t("archived"));
      onOpenChange(false);
      router.push(ROUTES.skills);
      router.refresh();
    },
  });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("archive")}
      description={t("archiveConfirm", { name: skill.name })}
      confirmLabel={t("archive")}
      pending={pending}
      errorKey={errorKey}
      onConfirm={() => run({ action: () => archiveSkillAction({ id: skill.id }) })}
    />
  );
}
