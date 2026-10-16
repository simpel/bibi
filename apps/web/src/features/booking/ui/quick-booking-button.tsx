"use client";

import { Button } from "@okazi/ui";
import { ZapIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { QuickBookingData } from "./quick-booking-data";
import { QuickBookingDialog } from "./quick-booking-dialog";

export type QuickBookingButtonProps = { data: QuickBookingData };

/** Opens the quick booking dialog (`booking.createQuick`). */
export function QuickBookingButton({ data }: QuickBookingButtonProps) {
  const t = useTranslations("booking");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ZapIcon />
        {t("createQuick")}
      </Button>
      <QuickBookingDialog data={data} open={open} onOpenChange={setOpen} />
    </>
  );
}
