import type { CalendarBlockDto } from "@bibi/core";
import type { getTranslations } from "next-intl/server";

type Translate = Awaited<ReturnType<typeof getTranslations<"line.day">>>;

/** The day snapshot's other bookings: the order's title, else "#41 Saab". */
export function dayLabels({ t }: { t: Translate }) {
  const blockLabel = ({ block }: { block: CalendarBlockDto }) => {
    const customer = block.details?.customer ?? null;
    if (block.reference === null) return block.title ?? t("blocked");
    if (block.orderTitle) return block.orderTitle;
    return customer
      ? t("booking", { reference: block.reference, customer })
      : t("bookingNoCustomer", { reference: block.reference });
  };
  return { blockLabel };
}
