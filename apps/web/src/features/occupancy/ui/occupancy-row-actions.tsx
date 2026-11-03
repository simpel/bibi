"use client";

import type { OccupancyDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveOccupancyDialog } from "./archive-occupancy-dialog";
import { OccupancyDialog } from "./occupancy-dialog";

export type OccupancyRowActionsProps = {
  occupancy: OccupancyDto;
  access: RowAccess;
  timeZone: string;
};

/** Edit and release of one manual block in the item's occupancy table. */
export function OccupancyRowActions({ occupancy, access, timeZone }: OccupancyRowActionsProps) {
  const t = useTranslations("occupancy");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={
          access.canEdit
            ? [{ label: t("edit"), icon: PencilIcon, onClick: () => setDialog("edit") }]
            : []
        }
      >
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <OccupancyDialog
        itemId={occupancy.itemId}
        occupancy={occupancy}
        timeZone={timeZone}
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
