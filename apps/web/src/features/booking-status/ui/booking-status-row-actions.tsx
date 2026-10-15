"use client";

import type { BookingStatusDto } from "@okazi/core/schemas";
import { useState } from "react";
import { ArchiveBookingStatusDialog } from "./archive-booking-status-dialog";
import { BookingStatusDialog } from "./booking-status-dialog";
import { BookingStatusMenu, type BookingStatusMenuChoice } from "./booking-status-menu";
import { TransitionsDialog } from "./transitions-dialog";

export type BookingStatusRowActionsProps = {
  status: BookingStatusDto;
  statuses: readonly BookingStatusDto[];
};

/** Edit / transitions / archive for one status. */
export function BookingStatusRowActions({ status, statuses }: BookingStatusRowActionsProps) {
  const [dialog, setDialog] = useState<BookingStatusMenuChoice | null>(null);
  return (
    <>
      <BookingStatusMenu onChoose={({ choice }) => setDialog(choice)} />
      <BookingStatusDialog
        status={status}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      {dialog === "transitions" ? (
        <TransitionsDialog
          status={status}
          statuses={statuses}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      ) : null}
      <ArchiveBookingStatusDialog
        status={status}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
