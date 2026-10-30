import { BoardCardView } from "./board-card-view";
import { BoardListView } from "./board-list-view";
import { BoardPhaseCardView } from "./board-phase-card-view";
import { CalendarRangeView } from "./calendar-range-view";
import { HoursCardView } from "./hours-card-view";
import { PipelineBoardView } from "./pipeline-board-view";

/**
 * The read models staff work from: the pipeline board, its boards and columns (ADR 0067) and the
 * calendar, part of `GENERATIVE_COMPONENTS`.
 */
export const BOARD_COMPONENTS = {
  "pipeline-board": PipelineBoardView,
  "board-list": BoardListView,
  "board-card": BoardCardView,
  "board-phase-card": BoardPhaseCardView,
  "calendar-range": CalendarRangeView,
  "hours-card": HoursCardView,
} as const;
