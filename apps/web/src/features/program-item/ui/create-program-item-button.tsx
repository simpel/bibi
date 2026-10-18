"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ProgramFormData } from "./program-form-data";
import { ProgramItemDialog } from "./program-item-dialog";

export type CreateProgramItemButtonProps = {
  data: ProgramFormData;
  ticketId: string;
  startsAt: Date;
};

/** Opens the program item dialog for the ticket on the page. */
export function CreateProgramItemButton(props: CreateProgramItemButtonProps) {
  const t = useTranslations("programItem");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <ProgramItemDialog {...props} open={open} onOpenChange={setOpen} />
    </>
  );
}
