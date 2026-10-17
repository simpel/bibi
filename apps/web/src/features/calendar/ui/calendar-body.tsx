import { buildGridModel } from "../calendar-grid-model";
import { calendarColumns, dayColumns, placeBlocks } from "../calendar-layout";
import { buildListModel } from "../calendar-list-model";
import type { CalendarParams } from "../calendar-params";
import type { CalendarData } from "../load-calendar";
import { CalendarGrid } from "./calendar-grid";
import { CalendarList } from "./calendar-list";
import { getCalendarLabels } from "./get-calendar-labels";

export type CalendarBodyProps = {
  params: CalendarParams;
  data: CalendarData;
  timeZone: string;
  /** Staff who can book see the empty-slot "Book with the assistant" buttons. */
  canBook: boolean;
};

/** The grid from `md` up and the list below it, both from the same data. */
export async function CalendarBody({ params, data, timeZone, canBook }: CalendarBodyProps) {
  const labels = await getCalendarLabels({ timeZone });
  const columns = calendarColumns({ params, timeZone });
  const model = buildGridModel({
    view: params.view,
    data,
    columns,
    place: ({ blocks }) => placeBlocks({ columns, blocks, view: params.view }),
    labels,
  });
  const days = buildListModel({ days: dayColumns({ params, timeZone }), data, labels });
  return (
    <>
      <CalendarGrid model={model} canBook={canBook} />
      <CalendarList days={days} />
    </>
  );
}
