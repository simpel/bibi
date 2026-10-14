"use client";

import type { MemberDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AssignRolesDialog } from "./assign-roles-dialog";

export type AssignRolesButtonProps = { member: MemberDto; roleNames: string[] };

/** Opens the role assignment dialog for one member. */
export function AssignRolesButton({ member, roleNames }: AssignRolesButtonProps) {
  const t = useTranslations("member");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t("assignRoles")}
      </Button>
      {open ? (
        <AssignRolesDialog member={member} roleNames={roleNames} open onOpenChange={setOpen} />
      ) : null}
    </>
  );
}
