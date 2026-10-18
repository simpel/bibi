import "server-only";
import { toIsoDate, toZonedParts } from "@okazi/core/schemas";
import { getFormatter, getTranslations } from "next-intl/server";
import type { CalendarBlock } from "../calendar-blocks";
import type { CalendarLabels } from "../calendar-grid-model";
import type { CalendarColumn } from "../calendar-layout";

const TIME = { hour: "2-digit", minute: "2-digit" } as const;
const DAY = { weekday: "short", day: "numeric", month: "short" } as const;
const DATE = { weekday: "long", day: "numeric", month: "long", year: "numeric" } as const;

const dayKey = ({ instant, timeZone }: { instant: Date; timeZone: string }) =>
  toIsoDate({ date: toZonedParts({ instant, timeZone }).date });

/** Times only, or with the dates when the block runs over midnight. */
const rangeOptions = ({ block, timeZone }: { block: CalendarBlock; timeZone: string }) =>
  dayKey({ instant: block.startsAt, timeZone }) === dayKey({ instant: block.endsAt, timeZone })
    ? { ...TIME, timeZone }
    : { ...DAY, ...TIME, timeZone };

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
    getFormatter(),
  ]);
  const at = ({ column }: { column: CalendarColumn }) =>
    format.dateTime(column.start, { ...TIME, timeZone });
  const date = ({ column }: { column: CalendarColumn }) =>
    format.dateTime(new Date(`${toIsoDate({ date: column.date })}T12:00:00Z`), {
      ...DATE,
      timeZone: "UTC",
    });
  return {
    type: ({ type }) => occupancy(`types.${type}`),
    reference: ({ reference }) => ticket("reference", { reference }),
    option: ({ position }) => t("option", { position }),
    time: ({ block }) =>
      format.dateTimeRange(block.startsAt, block.endsAt, rangeOptions({ block, timeZone })),
    column: ({ column }) =>
      column.hour !== null ? at({ column }) : format.dateTime(column.start, { ...DAY, timeZone }),
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
