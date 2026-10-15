"use client";

import type { BookingDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { PencilIcon, UserCogIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AssignDialog } from "./assign-dialog";
import { BookingDialog } from "./booking-dialog";
import type { BookingFormData } from "./booking-form-data";

export type BookingActionsProps = { booking: BookingDto; data: BookingFormData };

/** Edit and change-owners buttons of the booking detail page. */
export function BookingActions({ booking, data }: BookingActionsProps) {
  const t = useTranslations("booking");
  const [dialog, setDialog] = useState<"edit" | "assign" | null>(null);
  return (
    <>
      <Button variant="outline" onClick={() => setDialog("edit")}>
        <PencilIcon />
        {t("edit")}
      </Button>
      {data.members.length > 0 ? (
        <Button variant="outline" onClick={() => setDialog("assign")}>
          <UserCogIcon />
          {t("assign")}
        </Button>
      ) : null}
      <BookingDialog
        data={data}
        booking={booking}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <AssignDialog
        booking={booking}
        members={data.members}
        open={dialog === "assign"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
