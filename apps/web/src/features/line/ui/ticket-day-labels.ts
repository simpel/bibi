import type { CalendarBlockDto } from "@bibi/core";
import type { getTranslations } from "next-intl/server";

type Translate = Awaited<ReturnType<typeof getTranslations<"line.day">>>;

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/** The day snapshot's labels: hours ("01 +1" past midnight) and other bookings ("#41 Saab"). */
export function dayLabels({ t }: { t: Translate }) {
  const hourLabel = ({ hour }: { hour: number }) =>
    hour >= 24 ? t("nextDay", { hour: pad({ value: hour - 24 }) }) : pad({ value: hour });
  const blockLabel = ({ block }: { block: CalendarBlockDto }) => {
    const customer = block.details?.customer ?? null;
    if (block.reference === null) return block.title ?? t("blocked");
    return customer
      ? t("booking", { reference: block.reference, customer })
      : t("bookingNoCustomer", { reference: block.reference });
  };
  return { hourLabel, blockLabel };
}
