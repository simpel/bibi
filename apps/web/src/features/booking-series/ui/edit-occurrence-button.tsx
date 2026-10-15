"use client";

import type { SeriesOccurrenceDto } from "@okazi/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@okazi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "../../booking/ui/booking-form-data";
import { OccurrenceForm } from "./occurrence-form";

export type EditOccurrenceButtonProps = {
  seriesId: string;
  occurrence: SeriesOccurrenceDto;
  total: number;
  rooms: readonly NamedOption[];
};

/** Opens the dialog that changes this occurrence, or it and the following ones. */
export function EditOccurrenceButton({ total, ...props }: EditOccurrenceButtonProps) {
  const t = useTranslations("bookingSeries");
  const [open, setOpen] = useState(false);
  const index = props.occurrence.occurrenceIndex;
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("editOccurrenceLabel", { index, total })}
        onClick={() => setOpen(true)}
      >
        <PencilIcon />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editOccurrence", { index, total })}</DialogTitle>
            <DialogDescription>{t("editOccurrenceDescription")}</DialogDescription>
          </DialogHeader>
          <OccurrenceForm {...props} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
