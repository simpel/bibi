"use client";

import { Button, DangerZone, DangerZoneRow } from "@bibi/ui";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CancelReservationDialog } from "./cancel-reservation-dialog";

export type ReservationDangerAreaProps = { id: string; name: string };

/** Last on the reservation page: the one place it is cancelled from. */
export function ReservationDangerArea({ id, name }: ReservationDangerAreaProps) {
  const t = useTranslations("reservation.cancel");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <DangerZone title={common("dangerArea")}>
      <DangerZoneRow
        title={t("action")}
        description={t("description")}
        action={
          <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)}>
            <XIcon aria-hidden />
            {t("action")}
          </Button>
        }
      />
      <CancelReservationDialog id={id} name={name} open={open} onOpenChange={setOpen} />
    </DangerZone>
  );
}
