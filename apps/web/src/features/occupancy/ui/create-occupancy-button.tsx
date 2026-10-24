"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { OccupancyDialog } from "./occupancy-dialog";

/** `timeZone`: the zone of the item's venue (ADR 0064). */
export type CreateOccupancyButtonProps = { itemId: string; timeZone: string };

/** Opens the block dialog for the item on the page. */
export function CreateOccupancyButton({ itemId, timeZone }: CreateOccupancyButtonProps) {
  const t = useTranslations("occupancy");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <OccupancyDialog itemId={itemId} timeZone={timeZone} open={open} onOpenChange={setOpen} />
    </>
  );
}
