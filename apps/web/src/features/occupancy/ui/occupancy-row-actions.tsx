"use client";

import type { OccupancyDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveOccupancyDialog } from "./archive-occupancy-dialog";
import { OccupancyDialog } from "./occupancy-dialog";

export type OccupancyRowActionsProps = { occupancy: OccupancyDto; access: RowAccess };

/** Edit and release of one manual block in the item's occupancy table. */
export function OccupancyRowActions({ occupancy, access }: OccupancyRowActionsProps) {
  const t = useTranslations("occupancy");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <OccupancyDialog
        itemId={occupancy.itemId}
        occupancy={occupancy}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveOccupancyDialog
        occupancy={occupancy}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
