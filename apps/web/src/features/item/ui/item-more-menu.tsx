"use client";

import type { ItemDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { ArchiveIcon, HistoryIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { HistorySheet } from "@/features/audit-log/ui/history-sheet";
import { ArchiveItemDialog } from "./archive-item-dialog";

export type ItemMoreMenuProps = {
  item: ItemDto;
  /** The history list; null without `audit:read`. */
  history: ReactNode | null;
  /** `item:delete`. */
  canArchive: boolean;
};

/** The item page's ⋯ menu: View history and Archive item, each by its permission. */
export function ItemMoreMenu({ item, history, canArchive }: ItemMoreMenuProps) {
  const t = useTranslations("item");
  const audit = useTranslations("auditLog");
  const common = useTranslations("common");
  const [open, setOpen] = useState<"history" | "archive" | null>(null);
  if (!history && !canArchive) return null;
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {history ? (
          <DropdownMenuItem onSelect={() => setOpen("history")}>
            <HistoryIcon />
            {audit("viewHistory")}
          </DropdownMenuItem>
        ) : null}
        {canArchive ? (
          <DropdownMenuItem destructive onSelect={() => setOpen("archive")}>
            <ArchiveIcon />
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      {history ? (
        <HistorySheet
          open={open === "history"}
          onOpenChange={(next) => !next && setOpen(null)}
          history={history}
        />
      ) : null}
      {canArchive ? (
        <ArchiveItemDialog
          item={item}
          open={open === "archive"}
          onOpenChange={(next) => !next && setOpen(null)}
        />
      ) : null}
    </>
  );
}
