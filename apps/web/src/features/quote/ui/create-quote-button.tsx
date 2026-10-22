"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { QuoteDialog } from "./quote-dialog";

export type CreateQuoteButtonProps = { ticketId: string };

/** Opens the quote form for the ticket's first quote; the new draft opens on save. */
export function CreateQuoteButton({ ticketId }: CreateQuoteButtonProps) {
  const t = useTranslations("quote");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <QuoteDialog target={{ ticketId }} open={open} onOpenChange={setOpen} />
    </>
  );
}
