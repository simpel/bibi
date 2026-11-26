"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { LayoutOption } from "../lib/sitting-row";
import { ExceptionDialog, type SittingOption } from "./exception-dialog";

export type CreateExceptionButtonProps = {
  sittings: readonly SittingOption[];
  layouts: readonly LayoutOption[];
};

/** Create exception: opens the dialog with a date to pick. */
export function CreateExceptionButton({ sittings, layouts }: CreateExceptionButtonProps) {
  const t = useTranslations("tableBooking.exceptions");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={sittings.length === 0}>
        <PlusIcon />
        {t("create")}
      </Button>
      <ExceptionDialog open={open} onOpenChange={setOpen} sittings={sittings} layouts={layouts} />
    </>
  );
}
