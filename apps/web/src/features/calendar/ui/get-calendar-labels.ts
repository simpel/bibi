import "server-only";
import {
  type CalendarBlockDto,
  type DateTimeFormat,
  toIsoDate,
  toZonedParts,
} from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { getDateTimeFormat } from "@/server/date-time-format";
import type { CalendarLabels } from "../calendar-grid-model";
import type { CalendarColumn } from "../calendar-layout";

const dayKey = ({ instant, timeZone }: { instant: Date; timeZone: string }) =>
  toIsoDate({ date: toZonedParts({ instant, timeZone }).date });

const sameDay = ({ block, timeZone }: { block: CalendarBlockDto; timeZone: string }) =>
  dayKey({ instant: block.startsAt, timeZone }) === dayKey({ instant: block.endsAt, timeZone });

type BlockTimeInput = { format: DateTimeFormat; block: CalendarBlockDto; timeZone: string };

/** Times only, or with the days when the block runs over midnight. */
const blockTime = ({ format, block, timeZone }: BlockTimeInput) => {
  const span = { start: block.startsAt, end: block.endsAt, timeZone };
  return sameDay({ block, timeZone })
    ? format.timeRange(span)
    : format.dateTimeRange({ ...span, year: false, weekday: "short" });
};

/** The translators the grid and list need, built once per request from next-intl. */
export async function getCalendarLabels({
  timeZone,
}: {
  timeZone: string;
}): Promise<CalendarLabels> {
  const [t, occupancy, ticket, format] = await Promise.all([
    getTranslations("calendar"),
    getTranslations("occupancy"),
    getTranslations("ticket"),
    getDateTimeFormat(),
  ]);
  const at = ({ column }: { column: CalendarColumn }) =>
    format.time({ instant: column.start, timeZone });
  const dayLabel = ({ instant }: { instant: Date }) =>
    format.date({ instant, timeZone, year: false, weekday: "short" });
  const date = ({ column }: { column: CalendarColumn }) =>
    format.date({
      instant: new Date(`${toIsoDate({ date: column.date })}T12:00:00Z`),
      weekday: "long",
      timeZone: "UTC",
    });
  return {
    type: ({ type }) => occupancy(`types.${type}`),
    reference: ({ reference }) => ticket("reference", { reference }),
    heldSince: ({ heldAt }) => t("heldSince", { date: dayLabel({ instant: heldAt }) }),
    expires: ({ expiresAt }) => t("expires", { date: dayLabel({ instant: expiresAt }) }),
    time: ({ block }) => blockTime({ format, block, timeZone }),
    column: ({ column }) =>
      column.hour !== null ? at({ column }) : dayLabel({ instant: column.start }),
    slot: ({ space, column }) => {
      const when =
        column.hour !== null ? `${date({ column })} ${at({ column })}` : date({ column });
      const prompt =
        column.hour !== null
          ? t("bookPromptTime", { space, date: date({ column }), time: at({ column }) })
          : t("bookPromptDay", { space, date: date({ column }) });
      return { label: t("bookSlot", { space, when }), prompt };
    },
  };
}
