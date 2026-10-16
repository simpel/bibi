import type { BookingDto, BookingStatusDto } from "@okazi/core";
import { Button } from "@okazi/ui";
import { ArrowRightLeftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { ChangeStatusDialog } from "./change-status-dialog";

export type ChangeStatusButtonProps = {
  booking: BookingDto;
  statuses: readonly BookingStatusDto[];
};

/** The statuses the organization allows from the booking's current one, in status order. */
const statusTargets = ({ booking, statuses }: ChangeStatusButtonProps): NamedOption[] => {
  const current = statuses.find(({ id }) => id === booking.bookingStatusId);
  const allowed = new Set(current?.transitionsTo ?? []);
  return statuses.filter(({ id }) => allowed.has(id)).map(({ id, name }) => ({ id, name }));
};

/** Opens the change-status dialog; hidden when no transition leaves the current status. */
export function ChangeStatusButton({ booking, statuses }: ChangeStatusButtonProps) {
  const t = useTranslations("booking");
  const [open, setOpen] = useState(false);
  const targets = statusTargets({ booking, statuses });
  if (targets.length === 0) return null;
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ArrowRightLeftIcon />
        {t("changeStatus")}
      </Button>
      <ChangeStatusDialog booking={booking} targets={targets} open={open} onOpenChange={setOpen} />
    </>
  );
}
