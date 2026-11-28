"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  CreateReservationSheet,
  type CreateReservationSheetProps,
} from "./create-reservation-sheet";

export type CreateReservationButtonProps = Omit<
  CreateReservationSheetProps,
  "open" | "onOpenChange"
> & {
  /** Start with the sheet open (the create menu's link). */
  defaultOpen?: boolean;
};

/** Create reservation: opens the booking sheet for the room and day on screen. */
export function CreateReservationButton({
  defaultOpen = false,
  ...props
}: CreateReservationButtonProps) {
  const t = useTranslations("reservation");
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <Button className="h-12 px-5 text-base" onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create.title")}
      </Button>
      <CreateReservationSheet {...props} open={open} onOpenChange={setOpen} />
    </>
  );
}
