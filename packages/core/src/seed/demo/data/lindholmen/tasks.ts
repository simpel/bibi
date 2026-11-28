import type { DemoType } from "../../config-types";
import type { DemoTask } from "../../task-types";

/** Lindholmen's task types (ADR 0117, 0120). */
export const lindholmenTaskTypes: readonly DemoType[] = [
  { base: "TASK", name: "Site visit", pluralName: "Site visits" },
  { base: "TASK", name: "Final headcount due", pluralName: "Final headcounts due" },
  { base: "TASK", name: "To-do", pluralName: "To-dos" },
];

/**
 * Lindholmen's tasks (`docs/demo-seed.md`, Tasks): a site visit next Thursday before any order,
 * moved on the pipeline to Site visit (ADR 0121),
 * a site visit held and done before L3 was booked, L4's final headcount, overdue for Anna, two
 * site visits that set a room aside (a prebook) and block one (a book) beyond the busy calendar,
 * and a to-do with no customer and no due time.
 */
export const lindholmenTasks: readonly DemoTask[] = [
  {
    ...{ type: "Site visit", customer: "Kvarnby Design AB" },
    items: [{ item: "Vinga (auditorium)", hold: "RELATED" }],
    ...{ weekday: 3, due: "14:00", assignee: "Erik Lund", status: "Site visit" },
    note: "Product launch in March, about 80 people. Wants to see the auditorium.",
  },
  {
    ...{ type: "Site visit", customer: "Västra Sjukvårdsregionen", order: "L3" },
    items: [{ item: "Vinga (auditorium)", hold: "RELATED" }],
    ...{ day: -14, due: "10:00", assignee: "Johan Ek", doneDay: -14 },
    note: "Vinga for the plenary, Hönö for breakouts, about 60 people.",
  },
  {
    ...{ type: "Final headcount due", customer: "Göta Advokatbyrå KB", order: "L4" },
    ...{ day: -1, due: "12:00", assignee: "Anna Berg" },
    note: "Henrik confirms the final number for lunch.",
  },
  {
    ...{ type: "Site visit", customer: "Hisingen Energi AB" },
    items: [{ item: "Öckerö", hold: "PREBOOK", day: 35, from: "08:00", to: "17:00" }],
    ...{ day: 3, due: "10:00", assignee: "Erik Lund" },
    note: "Strategy day for the board. Öckerö is set aside until they decide.",
  },
  {
    ...{ type: "Site visit", customer: "Älvstrand Tech AB" },
    items: [{ item: "Knippla (workshop)", hold: "BOOK", day: 38, from: "09:00", to: "16:00" }],
    ...{ day: 5, due: "13:00", assignee: "Johan Ek" },
    note: "Hackathon, about 50 people. They agreed on the date; the order follows the visit.",
  },
  {
    type: "To-do",
    assignee: "Anna Berg",
    note: "Order new name badges for the reception.",
  },
];
