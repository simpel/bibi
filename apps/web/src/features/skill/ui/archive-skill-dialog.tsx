"use client";

import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ROUTES } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
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
  const common = useTranslations("common");
  const { run, pending } = useToastAction();
  const archive = () =>
    run({
      action: () => archiveSkillAction({ id: skill.id }),
      messages: { pending: common("archiving"), success: t("archived") },
      onSuccess: () => {
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
      onConfirm={archive}
    />
  );
}
