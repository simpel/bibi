import type { DraftText, TicketDraft } from "@bibi/core";
import type { InputStep, IntakeWho } from "./intake-state";
import type { GuessedValue } from "./open-questions";
import type { WhenFormValues } from "./when-form-schema";

/** The fields of a draft as the panel and the questions name them (`ticketIntake.draft.fields`). */
export const DRAFT_FIELDS = [
  ...["sender", "company", "email", "phone", "date", "start", "end", "guests"],
  ...["wish", "package", "need", "notes"],
] as const;
export type DraftField = (typeof DRAFT_FIELDS)[number];

/** One row of "What the assistant read": the value as shown, its quote and whether guessed. */
export type ReadField = { field: DraftField; value: string; quote: string; guessed: boolean };

/** What reading a message left on the intake (ADR 0084), kept in the local draft. */
export type MessageDraft = {
  read: ReadField[];
  /** Guessed values: each is an open question until kept or changed. */
  guesses: GuessedValue[];
  /** The matched customer and contact, preselected in step 1 (not chosen until Next). */
  who: IntakeWho | null;
  /** The suggested package (★ on its card). */
  templateId: string | null;
  /** Step 1's search when no customer was matched. */
  search: string | null;
  /** The booking note step 4 starts with. */
  note: string;
  /** Step 2 as read, also when incomplete. */
  when: WhenFormValues;
};

/** How values are shown: the day and a time in the user's formats and the organization's zone. */
export type DraftDisplay = {
  day: (input: { iso: string }) => string;
  time: (input: { instant: Date }) => string;
  timeZone: string;
};

type Evidence = { quote: string; guessed: boolean };
type Row = { field: DraftField; value: string } & Evidence;

const row = ({ field, value, quote, guessed }: Row): ReadField => ({
  ...{ field, value, quote, guessed },
});

const textRows = ({ draft }: { draft: TicketDraft }): ReadField[] => {
  const texts: [DraftField, DraftText | null][] = [
    ["sender", draft.sender],
    ["company", draft.company],
    ["email", draft.email],
    ["phone", draft.phone],
  ];
  return texts.flatMap(([field, text]) => (text ? [row({ field, ...text })] : []));
};

/** Every field the draft has, in the panel's order. */
export function readRows({ draft, display }: { draft: TicketDraft; display: DraftDisplay }) {
  const rows = textRows({ draft });
  const { date, start, end, headcount } = draft;
  if (date) rows.push(row({ field: "date", ...date, value: display.day({ iso: date.value }) }));
  if (start)
    rows.push(row({ field: "start", ...start, value: display.time({ instant: start.value }) }));
  if (end) rows.push(row({ field: "end", ...end, value: display.time({ instant: end.value }) }));
  if (headcount) rows.push(row({ field: "guests", ...headcount, value: String(headcount.value) }));
  if (draft.wish) rows.push(row({ field: "wish", ...draft.wish }));
  if (draft.package) rows.push(row({ field: "package", ...draft.package }));
  for (const need of draft.needs) {
    rows.push(row({ field: "need", ...need, value: `${need.value} × ${need.count}` }));
  }
  if (draft.notes) rows.push(row({ field: "notes", ...draft.notes }));
  return rows;
}

const STEP_OF: Partial<Record<DraftField, InputStep>> = {
  sender: "who",
  company: "who",
  email: "who",
  date: "when",
  start: "when",
  end: "when",
  guests: "when",
  package: "package",
};

/** Each guessed row becomes a question; Change reopens its step, or the note for the rest. */
export function guessesOf({ rows }: { rows: readonly ReadField[] }): GuessedValue[] {
  return rows
    .filter(({ guessed }) => guessed)
    .map(({ field, value }, index) => ({
      ...{ key: `${field}.${index}`, field, value },
      step: STEP_OF[field] ?? null,
    }));
}
