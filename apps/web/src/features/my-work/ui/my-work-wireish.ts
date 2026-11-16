import type { MyWork, MyWorkCard, MyWorkFlag, MyWorkTask } from "@bibi/core/schemas";

export type MyWorkFlagWireish = Omit<MyWorkFlag, "at"> & { at: Date | string | null };

/** A card as the page has it (dates) or as a tool result carries it (ISO strings). */
export type MyWorkCardWireish = Omit<MyWorkCard, "startsAt" | "endsAt" | "flags"> & {
  startsAt: Date | string;
  endsAt: Date | string;
  flags: MyWorkFlagWireish[];
};

/** The caller's timeline as the page or the assistant's card has it, so both share the cards. */
export type MyWorkWireish = Pick<MyWork, "from" | "to" | "timeZone"> & {
  now: Date | string;
  cards: MyWorkCardWireish[] | null;
};

/** A Needs you task as the page has it (dates) or as a tool result carries it (ISO strings). */
export type MyWorkTaskWireish = Omit<MyWorkTask, "dueAt"> & { dueAt: Date | string };
