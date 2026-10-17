"use client";

import type { SeriesOccurrenceDto } from "@okazi/core";
import {
  DataTableRowActions,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenuItem,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { OccurrenceForm } from "./occurrence-form";

export type OccurrenceRowActionsProps = {
  seriesId: string;
  occurrence: SeriesOccurrenceDto;
  total: number;
  rooms: readonly NamedOption[];
};

/** The row menu of an occurrence; "Change" opens the dialog for this and the following ones. */
export function OccurrenceRowActions({ total, ...props }: OccurrenceRowActionsProps) {
  const t = useTranslations("bookingSeries");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const index = props.occurrence.occurrenceIndex;
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setOpen(true)}>
          {t("editOccurrence", { index, total })}
        </DropdownMenuItem>
      </DataTableRowActions>
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
