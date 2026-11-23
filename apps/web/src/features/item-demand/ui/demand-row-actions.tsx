"use client";

import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveDemandDialog } from "./archive-demand-dialog";
import { DemandDialog } from "./demand-dialog";
import type { DemandList, DemandRow } from "./demand-types";

export type DemandRowActionsProps = { row: DemandRow; list: DemandList };

/** Edit and remove one demand of the item (both are `item:write`, ADR 0050). */
export function DemandRowActions({ row, list }: DemandRowActionsProps) {
  const t = useTranslations("itemDemand");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={[{ label: t(`${list}.edit`), icon: PencilIcon, onClick: () => setDialog("edit") }]}
      >
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t(`${list}.archive`)}
        </DropdownMenuItem>
      </DataTableRowActions>
      <DemandDialog
        itemId={row.demand.itemId}
        pools={[]}
        list={list}
        demand={row.demand}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveDemandDialog
        demand={row.demand}
        targetName={row.targetName}
        list={list}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
