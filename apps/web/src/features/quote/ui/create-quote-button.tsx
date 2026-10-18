"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { QuoteDialog } from "./quote-dialog";

export type CreateQuoteButtonProps = { ticketId: string; items: readonly NamedOption[] };

/** Opens the quote form for the ticket's first quote; the new draft opens on save. */
export function CreateQuoteButton({ ticketId, items }: CreateQuoteButtonProps) {
  const t = useTranslations("quote");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <QuoteDialog target={{ ticketId }} items={items} open={open} onOpenChange={setOpen} />
    </>
  );
}
