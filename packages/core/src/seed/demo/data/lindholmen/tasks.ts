import type { DemoType } from "../../config-types";
import type { DemoTask } from "../../task-types";

/** Lindholmen's task types (ADR 0117): a meeting and a deadline. */
export const lindholmenTaskTypes: readonly DemoType[] = [
  { base: "TASK", name: "Site visit", pluralName: "Site visits", taskShape: "MEETING" },
  {
    base: "TASK",
    name: "Final headcount due",
    pluralName: "Final headcounts due",
    taskShape: "DEADLINE",
  },
];

/**
 * Lindholmen's tasks (`docs/demo-seed.md`, Tasks): a site visit next Thursday before any order,
 * a site visit held and done before L3 was booked, and L4's final headcount, overdue for Anna.
 */
export const lindholmenTasks: readonly DemoTask[] = [
  {
    ...{ type: "Site visit", customer: "Kvarnby Design AB", item: "Vinga (auditorium)" },
    ...{ weekday: 3, from: "14:00", to: "15:00", assignee: "Erik Lund" },
    note: "Product launch in March, about 80 people. Wants to see the auditorium.",
  },
  {
    ...{ type: "Site visit", customer: "Västra Sjukvårdsregionen", order: "L3" },
    ...{ item: "Vinga (auditorium)", day: -14, from: "10:00", to: "11:00" },
    ...{ assignee: "Johan Ek", doneDay: -14 },
    note: "Vinga for the plenary, Hönö for breakouts, about 60 people.",
  },
  {
    ...{ type: "Final headcount due", customer: "Göta Advokatbyrå KB", order: "L4" },
    ...{ day: -1, from: "12:00", assignee: "Anna Berg" },
    note: "Henrik confirms the final number for lunch.",
  },
];
