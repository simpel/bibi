"use client";

import {
  DataTableRowActions,
  DropdownMenuItem,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

export type HistorySheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The server-rendered history list. */
  history: ReactNode;
};

/** Side sheet with an entity's full change history. */
export function HistorySheet({ open, onOpenChange, history }: HistorySheetProps) {
  const t = useTranslations("auditLog");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("history")}</SheetTitle>
        </SheetHeader>
        {history}
      </SheetContent>
    </Sheet>
  );
}

export type HistoryMenuProps = { history: ReactNode };

/** A more (⋯) menu whose only entry opens the history sheet, for pages without other overflow actions. */
export function HistoryMenu({ history }: HistoryMenuProps) {
  const t = useTranslations("auditLog");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setOpen(true)}>{t("viewHistory")}</DropdownMenuItem>
      </DataTableRowActions>
      <HistorySheet open={open} onOpenChange={setOpen} history={history} />
    </>
  );
}
