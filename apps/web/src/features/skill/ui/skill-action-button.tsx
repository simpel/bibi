"use client";

import type { SkillDto } from "@bibi/core";
import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { ActionResult } from "@/lib/action-result";
import { useRouter } from "@/lib/navigation";
import { skillRoute } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";

export type SkillActionButtonProps = {
  icon: ReactNode;
  label: string;
  /** Toast text on success. */
  doneMessage: string;
  run: () => Promise<ActionResult<SkillDto>>;
  /** Open the resulting skill (share creates a copy) instead of refreshing this page. */
  openResult?: boolean;
};

/** A skill lifecycle action (publish, share): runs the server action, one toast, refreshes. */
export function SkillActionButton({
  icon,
  label,
  doneMessage,
  run,
  openResult = false,
}: SkillActionButtonProps) {
  const common = useTranslations("common");
  const router = useRouter();
  const { run: runAction, pending } = useToastAction();
  const onClick = () =>
    runAction({
      action: run,
      messages: { pending: common("sending"), success: doneMessage },
      onSuccess: ({ value }) => {
        if (openResult) router.push(skillRoute({ id: value.id }));
        else router.refresh();
      },
    });
  return (
    <Button variant="outline" disabled={pending} onClick={onClick}>
      {icon}
      {label}
    </Button>
  );
}
