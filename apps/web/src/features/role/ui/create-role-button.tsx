"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RoleDialog } from "./role-dialog";

/** Opens the create-role dialog. */
export function CreateRoleButton() {
  const t = useTranslations("role");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <RoleDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
