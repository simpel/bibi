"use client";

import { Button } from "@bibi/ui";
import { LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BlockTablesDialog } from "@/features/reservation/ui/block-tables-dialog";

export type CreateBlockButtonProps = {
  roomItemId: string;
  /** Today in the room's zone: where a new block starts. */
  date: string;
  tables: readonly { id: string; label: string; seats: number }[];
};

/** Block tables for any period ahead: opens the same dialog as the floor. */
export function CreateBlockButton({ roomItemId, date, tables }: CreateBlockButtonProps) {
  const t = useTranslations("tableBooking.blocks");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <LockIcon />
        {t("create")}
      </Button>
      <BlockTablesDialog
        roomItemId={roomItemId}
        date={date}
        tables={tables}
        tableId={null}
        startTime="17:00"
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
