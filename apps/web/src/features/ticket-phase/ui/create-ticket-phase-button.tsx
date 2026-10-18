"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TicketPhaseDialog } from "./ticket-phase-dialog";

/** Opens the create-phase dialog. */
export function CreateTicketPhaseButton() {
  const t = useTranslations("ticketPhase");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <TicketPhaseDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
