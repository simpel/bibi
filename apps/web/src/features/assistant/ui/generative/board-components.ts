import { CalendarRangeView } from "./calendar-range-view";
import { HoursCardView } from "./hours-card-view";
import { PipelineBoardView } from "./pipeline-board-view";

/** The read models staff work from: the pipeline board and the calendar, part of `GENERATIVE_COMPONENTS`. */
export const BOARD_COMPONENTS = {
  "pipeline-board": PipelineBoardView,
  "calendar-range": CalendarRangeView,
  "hours-card": HoursCardView,
} as const;
