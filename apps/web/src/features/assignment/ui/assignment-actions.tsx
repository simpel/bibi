"use client";

import { useRouter } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { BellIcon, BellOffIcon, UserCogIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { useToastAction } from "@/lib/use-toast-action";
import { followAction, unfollowAction } from "../actions";
import { AssignDialog } from "./assign-dialog";
import type { AssignSubject } from "./assign-form-schema";

export type AssignmentActionsProps = {
  subject: AssignSubject;
  assigneeId: string | null;
  members: readonly NamedOption[];
  /** The signed-in member; null hides follow. */
  userId: string | null;
  following: boolean;
};

/** Change the main assignee and follow or unfollow as the signed-in member. */
export function AssignmentActions({
  subject,
  userId,
  following,
  ...props
}: AssignmentActionsProps) {
  const t = useTranslations("assignment");
  const common = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { run, pending } = useToastAction();
  const toggle = () => {
    if (!userId) return;
    const input = { ...subject, userId };
    run({
      action: () => (following ? unfollowAction({ input }) : followAction({ input })),
      messages: { pending: common("saving"), success: following ? t("unfollowed") : t("followed") },
      onSuccess: () => router.refresh(),
    });
  };
  return (
    <div className="flex flex-wrap gap-2">
      {props.members.length > 0 ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <UserCogIcon />
          {t("assign")}
        </Button>
      ) : null}
      {userId ? (
        <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
          {following ? <BellOffIcon /> : <BellIcon />}
          {following ? t("unfollow") : t("follow")}
        </Button>
      ) : null}
      <AssignDialog {...props} subject={subject} open={open} onOpenChange={setOpen} />
    </div>
  );
}
