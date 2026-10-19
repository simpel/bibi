"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LineDialog } from "./line-dialog";
import type { ProgramFormData } from "./program-form-data";

export type CreateLineButtonProps = {
  data: ProgramFormData;
  ticketId: string;
  startsAt: Date;
};

/** Opens the line dialog for the ticket on the page. */
export function CreateLineButton(props: CreateLineButtonProps) {
  const t = useTranslations("line");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <LineDialog {...props} open={open} onOpenChange={setOpen} />
    </>
  );
}
