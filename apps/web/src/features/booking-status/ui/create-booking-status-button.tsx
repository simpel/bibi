"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BookingStatusDialog } from "./booking-status-dialog";

/** Opens the create-status dialog. */
export function CreateBookingStatusButton() {
  const t = useTranslations("bookingStatus");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <BookingStatusDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
