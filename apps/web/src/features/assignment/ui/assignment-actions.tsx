"use client";

import { Button } from "@bibi/ui";
import { UserCogIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { AssignDialog } from "./assign-dialog";
import type { AssignSubject } from "./assign-form-schema";

export type AssignmentActionsProps = {
  subject: AssignSubject;
  assigneeId: string | null;
  members: readonly NamedOption[];
};

/** Change the main assignee. Follow sits on the subject's title row (`FollowButton`). */
export function AssignmentActions({ subject, ...props }: AssignmentActionsProps) {
  const t = useTranslations("assignment");
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      {props.members.length > 0 ? (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <UserCogIcon />
          {t("assign")}
        </Button>
      ) : null}
      <AssignDialog {...props} subject={subject} open={open} onOpenChange={setOpen} />
    </div>
  );
}
