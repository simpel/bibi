"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AlternativeGroupForm } from "./alternative-group-form";
import type { OptionLine } from "./option-line";

export type CreateAlternativeGroupButtonProps = { ticketId: string; lines: OptionLine[] };

/** Opens the dialog that makes some of the ticket's lines alternatives (like line create). */
export function CreateAlternativeGroupButton({
  ticketId,
  lines,
}: CreateAlternativeGroupButtonProps) {
  const t = useTranslations("alternativeGroup");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("create")}</DialogTitle>
            <DialogDescription>{t("createDescription")}</DialogDescription>
          </DialogHeader>
          <AlternativeGroupForm ticketId={ticketId} lines={lines} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
