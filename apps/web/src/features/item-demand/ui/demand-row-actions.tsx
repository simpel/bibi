"use client";

import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveDemandDialog } from "./archive-demand-dialog";
import { DemandDialog } from "./demand-dialog";
import type { DemandRow } from "./demand-types";

export type DemandRowActionsProps = { row: DemandRow };

/** Edit and remove one demand of the item (both are `item:write`, ADR 0050). */
export function DemandRowActions({ row }: DemandRowActionsProps) {
  const t = useTranslations("itemDemand");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <DemandDialog
        itemId={row.demand.itemId}
        pools={[]}
        demand={row.demand}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveDemandDialog
        demand={row.demand}
        targetName={row.targetName}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
