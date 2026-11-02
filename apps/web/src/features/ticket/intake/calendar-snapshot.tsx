import type { CalendarBlockDto } from "@bibi/core";
import { Button, DaySnapshot } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import { snapshotOf } from "./snapshot-model";
import { useItemBlocks } from "./use-item-blocks";
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
    return customer
      ? t("booking", { reference: block.reference, customer })
      : t("bookingNoCustomer", { reference: block.reference });
  };
  return { t, hourLabel, blockLabel };
}

/**
 * The requested day for the resources the lines use (spec "Calendar snapshot"): other bookings
 * and this ticket's draft lines, pool shortages under it, and a link to the full calendar.
 */
export function CalendarSnapshot({ model, nonce }: CalendarSnapshotProps) {
  const { t, hourLabel, blockLabel } = useLabels();
  const { review, when, timeZone, planned, data } = model;
  const itemIds = review.lines.flatMap((line) =>
    line.itemId && line.startsAt ? [line.itemId] : [],
  );
  const blocks = useItemBlocks({ date: when.date, itemIds, nonce });
  const midnight = fromLocalInputValue({ value: `${when.date}T00:00`, timeZone });
  if (!midnight || data.catalog.itemsHidden) return null;
  const bookable = data.catalog.items.filter((item) => item.capabilities.includes("BOOKABLE"));
  const itemNames = new Map(bookable.map(({ id, name }) => [id, name]));
  const snapshot = snapshotOf({
    ...{ lines: review.lines, planned, blocks, midnight, itemNames, blockLabel },
    programLabel: t("program"),
  });
  return (
    <section className="grid gap-2" aria-label={t("title")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{t("title")}</h3>
        <Button asChild variant="link" size="sm">
          <Link href={`${ROUTES.calendar}/${when.date}/${when.date}`}>{t("openCalendar")}</Link>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <DaySnapshot
          {...{ rows: snapshot.rows, hourLabel, className: "min-w-[36rem]" }}
          {...{ startMinute: snapshot.startMinute, endMinute: snapshot.endMinute }}
        />
      </div>
      {snapshot.shortages.length > 0 ? (
        <ul className="grid gap-0.5 text-sm text-warning-foreground">
          {snapshot.shortages.map(({ name, needed, free }) => (
            <li key={name}>{t("shortage", { name, needed, free })}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
