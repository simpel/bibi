"use client";

import type { OccupancyDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { PencilIcon, Undo2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveOccupancyDialog } from "./archive-occupancy-dialog";
import { OccupancyDialog } from "./occupancy-dialog";

export type OccupancyRowActionsProps = { occupancy: OccupancyDto };

/** Edit and release of one manual block in the item's occupancy table. */
export function OccupancyRowActions({ occupancy }: OccupancyRowActionsProps) {
  const t = useTranslations("occupancy");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" aria-label={t("edit")} onClick={() => setDialog("edit")}>
        <PencilIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("archive")}
        onClick={() => setDialog("archive")}
      >
        <Undo2Icon />
      </Button>
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
    </div>
  );
}
