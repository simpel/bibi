"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

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
