"use client";

import type { SkillDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";
import { errorKeyForCode } from "@/lib/error-key";
import { skillRoute } from "@/lib/routes";

export type SkillActionButtonProps = {
  icon: ReactNode;
  label: string;
  /** Toast text on success. */
  doneMessage: string;
  run: () => Promise<ActionResult<SkillDto>>;
  /** Open the resulting skill (share creates a copy) instead of refreshing this page. */
  openResult?: boolean;
};

/** A skill lifecycle action (publish, share): runs the server action, toasts, refreshes. */
export function SkillActionButton({
  icon,
  label,
  doneMessage,
  run,
  openResult = false,
}: SkillActionButtonProps) {
  const errors = useTranslations("errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const onClick = () =>
    startTransition(async () => {
      const result = await run();
      if (!result.ok) return void toast.error(errors(errorKeyForCode({ code: result.error.code })));
      toast.success(doneMessage);
      if (openResult) router.push(skillRoute({ id: result.value.id }));
      else router.refresh();
    });
  return (
    <Button variant="outline" disabled={pending} onClick={onClick}>
      {icon}
      {label}
    </Button>
  );
}
