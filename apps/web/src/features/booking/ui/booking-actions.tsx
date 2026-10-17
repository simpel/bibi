"use client";

import type { BookingDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BookingDialog } from "./booking-dialog";
import type { BookingFormData } from "./booking-form-data";
import { ChangeStatusButton } from "./change-status-button";

export type BookingActionsProps = { booking: BookingDto; data: BookingFormData };

/** Edit and change-status buttons of the booking detail page. */
export function BookingActions({ booking, data }: BookingActionsProps) {
  const t = useTranslations("booking");
  const [editing, setEditing] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setEditing(true)}>
        <PencilIcon />
        {t("edit")}
      </Button>
      <ChangeStatusButton booking={booking} statuses={data.statuses} />
      <BookingDialog data={data} booking={booking} open={editing} onOpenChange={setEditing} />
    </>
  );
}
