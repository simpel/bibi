import type { BookingDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { PencilIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { bookingRoute, updateRoute } from "@/lib/routes";
import type { BookingFormData } from "./booking-form-data";
import { ChangeStatusButton } from "./change-status-button";

export type BookingActionsProps = { booking: BookingDto; data: BookingFormData };

/** Edit (its own page) and change-status buttons of the booking detail page. */
export async function BookingActions({ booking, data }: BookingActionsProps) {
  const t = await getTranslations("booking");
  return (
    <>
      <Button asChild variant="outline">
        <Link href={updateRoute({ detail: bookingRoute({ id: booking.id }) })}>
          <PencilIcon />
          {t("edit")}
        </Link>
      </Button>
      <ChangeStatusButton booking={booking} statuses={data.statuses} />
    </>
  );
}
