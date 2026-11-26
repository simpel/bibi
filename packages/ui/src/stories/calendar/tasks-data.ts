import type {
  AssetBooking,
  CalendarTaskEntry,
} from "../../components/availability-calendar/calendar-types";
import { STORY_DAY } from "./story-dates";

/** The story day's tasks: a site visit in Vinga, a task that slipped and one done. */
export const STORY_TASKS: readonly CalendarTaskEntry[] = [
  {
    id: "task-visit",
    date: STORY_DAY,
    start: "14:00",
    label: "Site visit",
    timeLabel: "14:00",
    assetIds: ["vinga"],
    href: "#",
  },
  {
    id: "task-menu",
    date: STORY_DAY,
    start: "09:00",
    label: "Confirm menu",
    timeLabel: "09:00",
    overdue: true,
    href: "#",
  },
  {
    id: "task-headcount",
    date: STORY_DAY,
    start: "12:00",
    label: "Send final headcount",
    timeLabel: "12:00",
    assetIds: ["restaurant"],
    href: "#",
  },
  {
    id: "task-call",
    date: STORY_DAY,
    start: "08:30",
    label: "Kick-off call",
    timeLabel: "08:30",
    done: true,
    href: "#",
  },
];

const hold = {
  type: "Room",
  place: null,
  setupMinutes: 0,
  teardownMinutes: 0,
  quantity: 1,
  order: null,
  customer: null,
  date: STORY_DAY,
  href: "#",
} as const;

/**
 * A task's room holds (ADR 0120): a prebook is hatched and may overlap, a book is a tint that
 * blocks; both in the task colour with a solid edge, never an order line's colour or dash.
 */
export const STORY_TASK_HOLDS: readonly AssetBooking[] = [
  {
    ...hold,
    id: "hold-prebook",
    taskId: "task-visit",
    name: "Site visit",
    assetId: "aspero",
    start: "10:00",
    end: "16:00",
    state: { name: "Prebooked", color: "var(--task)", ink: "var(--foreground)", hold: "soft" },
  },
  {
    ...hold,
    id: "hold-book",
    taskId: "task-headcount",
    name: "Tasting",
    assetId: "vinga",
    start: "09:00",
    end: "12:00",
    state: { name: "Booked", color: "var(--task)", ink: "var(--foreground)", hold: "hard" },
  },
];
