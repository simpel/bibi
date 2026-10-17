"use client";

import type { BookingStatusDto } from "@okazi/core/schemas";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveBookingStatusDialog } from "./archive-booking-status-dialog";
import { BookingStatusDialog } from "./booking-status-dialog";
import { MoveItems } from "./move-items";
import { TransitionsDialog } from "./transitions-dialog";

export type BookingStatusRowActionsProps = {
  status: BookingStatusDto;
  index: number;
  statuses: readonly BookingStatusDto[];
};

type Dialog = "edit" | "transitions" | "archive";

/** Edit / transitions / move / archive for one status. */
export function BookingStatusRowActions({ status, index, statuses }: BookingStatusRowActionsProps) {
  const t = useTranslations("bookingStatus");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setDialog("transitions")}>
          {t("editTransitions")}
        </DropdownMenuItem>
        <MoveItems statuses={statuses} index={index} />
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
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
