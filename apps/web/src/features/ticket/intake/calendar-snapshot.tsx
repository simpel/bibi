import type { CalendarBlockDto } from "@bibi/core";
import { Button, DaySnapshot } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ticketName } from "@/lib/ticket-label";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import { CalendarDialog } from "./calendar-dialog";
import { snapshotOf } from "./snapshot-model";
import { useItemBlocks } from "./use-item-blocks";
import { useItemLines } from "./use-item-lines";
import type { ReviewModel } from "./use-review-model";

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

export type CalendarSnapshotProps = { model: ReviewModel; nonce: number };

/** The labels of the snapshot: hours ("01 +1" past midnight) and other bookings. */
function useLabels() {
  const t = useTranslations("ticketIntake.snapshot");
  const hourLabel = ({ hour }: { hour: number }) =>
    hour >= 24 ? t("nextDay", { hour: pad({ value: hour - 24 }) }) : pad({ value: hour });
  const blockLabel = ({ block }: { block: CalendarBlockDto }) => {
    const customer = block.details?.customer ?? null;
    if (block.reference === null) return block.title ?? t("blocked");
    const fallback = customer
      ? t("booking", { reference: block.reference, customer })
      : t("bookingNoCustomer", { reference: block.reference });
    return ticketName({ title: block.ticketTitle, fallback });
  };
  return { t, hourLabel, blockLabel };
}

/** The day's other bookings of the lines' items: occupancy for bookable ones, lines for the rest. */
function useOtherBookings({ model, nonce }: CalendarSnapshotProps) {
  const { review, when, timeZone, data } = model;
  const itemIds = review.lines.flatMap((line) =>
    line.itemId && line.startsAt ? [line.itemId] : [],
  );
  const bookable = new Set(
    data.catalog.items.filter((item) => item.capabilities.includes("BOOKABLE")).map(({ id }) => id),
  );
  const midnight = fromLocalInputValue({ value: `${when.date}T00:00`, timeZone }) ?? null;
  const blocks = useItemBlocks({ date: when.date, itemIds, nonce });
  const unbooked = itemIds.filter((id) => !bookable.has(id));
  const itemLines = useItemLines({ midnight, itemIds: unbooked, nonce });
  return { midnight, blocks, itemLines };
}

/**
 * The requested day for the items the lines use (spec "Calendar snapshot"): other bookings in
 * gray under this ticket's draft lines, pool shortages under it, and the full calendar in a dialog.
 */
export function CalendarSnapshot({ model, nonce }: CalendarSnapshotProps) {
  const { t, hourLabel, blockLabel } = useLabels();
  const [calendar, setCalendar] = useState(false);
  const { review, planned, data } = model;
  const { midnight, blocks, itemLines } = useOtherBookings({ model, nonce });
  if (!midnight || data.catalog.itemsHidden) return null;
  const itemNames = new Map(data.catalog.items.map(({ id, name }) => [id, name]));
  const snapshot = snapshotOf({
    ...{ lines: review.lines, planned, blocks, itemLines, midnight, itemNames, blockLabel },
    otherLabel: t("otherLines"),
  });
  return (
    <section className="grid gap-2" aria-label={t("title")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{t("title")}</h3>
        <Button type="button" variant="link" size="sm" onClick={() => setCalendar(true)}>
          {t("openCalendar")}
        </Button>
      </div>
      <DaySnapshot
        {...{ rows: snapshot.rows, hourLabel }}
        {...{ startMinute: snapshot.startMinute, endMinute: snapshot.endMinute }}
      />
      {snapshot.shortages.length > 0 ? (
        <ul className="grid gap-0.5 text-sm text-warning-foreground">
          {snapshot.shortages.map(({ name, needed, free }) => (
            <li key={name}>{t("shortage", { name, needed, free })}</li>
          ))}
        </ul>
      ) : null}
      {calendar ? <CalendarDialog model={model} onClose={() => setCalendar(false)} /> : null}
    </section>
  );
}
