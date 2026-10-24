import { buildGridModel } from "../calendar-grid-model";
import { calendarColumns, dayColumns, placeBlocks } from "../calendar-layout";
import { buildListModel } from "../calendar-list-model";
import { monthWeeks } from "../calendar-month-model";
import type { CalendarParams } from "../calendar-params";
import { periodDays, viewOf } from "../calendar-period";
import type { CalendarData } from "../load-calendar";
import { CalendarGrid } from "./calendar-grid";
import { CalendarList } from "./calendar-list";
import { CalendarMonth } from "./calendar-month";
import { getCalendarLabels } from "./get-calendar-labels";

export type CalendarBodyProps = {
  params: CalendarParams;
  data: CalendarData;
  timeZone: string;
  /** Staff who can book see the empty-slot "Book with the assistant" buttons. */
  canBook: boolean;
};

/**
 * The view the period gives (ADR 0064): the grid for a day or week, weeks of days for a month and
 * a list for any other range. Below `md` the grid and the month give way to the list.
 */
export async function CalendarBody({ params, data, timeZone, canBook }: CalendarBodyProps) {
  const labels = await getCalendarLabels({ timeZone });
  const view = viewOf({ period: params.period });
  const dates = periodDays({ period: params.period });
  const days = buildListModel({ days: dayColumns({ days: dates, timeZone }), data, labels });
  if (view === "list") return <CalendarList days={days} always />;
  if (view === "month") {
    const { period, ...filters } = params;
    return (
      <>
        <CalendarMonth weeks={monthWeeks({ dates, days })} filters={filters} />
        <CalendarList days={days} />
      </>
    );
  }
  const columns = calendarColumns({ view, days: dates, timeZone });
  const place = ({ blocks }: { blocks: CalendarData["blocks"] }) =>
    placeBlocks({ columns, blocks, view });
  const model = buildGridModel({ view, data, columns, place, labels });
  return (
    <>
      <CalendarGrid model={model} canBook={canBook} />
      <CalendarList days={days} />
    </>
  );
}
