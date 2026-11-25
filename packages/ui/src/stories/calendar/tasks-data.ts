import type { CalendarTaskEntry } from "../../components/availability-calendar/calendar-types";
import { STORY_DAY } from "./story-dates";

/** The story day's tasks: a site visit in Vinga, a deadline that slipped and one done. */
export const STORY_TASKS: readonly CalendarTaskEntry[] = [
  {
    id: "task-visit",
    shape: "meeting",
    date: STORY_DAY,
    start: "14:00",
    end: "15:00",
    label: "Site visit",
    timeLabel: "14:00",
    assetId: "vinga",
    href: "#",
  },
  {
    id: "task-menu",
    shape: "deadline",
    date: STORY_DAY,
    start: "09:00",
    label: "Confirm menu",
    timeLabel: "09:00",
    overdue: true,
    href: "#",
  },
  {
    id: "task-headcount",
    shape: "deadline",
    date: STORY_DAY,
    start: "12:00",
    label: "Send final headcount",
    timeLabel: "12:00",
    assetId: "restaurant",
    href: "#",
  },
  {
    id: "task-call",
    shape: "meeting",
    date: STORY_DAY,
    start: "08:30",
    end: "09:30",
    label: "Kick-off call",
    timeLabel: "08:30",
    done: true,
    href: "#",
  },
];
