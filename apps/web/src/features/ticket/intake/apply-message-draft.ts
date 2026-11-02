import type { TicketDraft } from "@bibi/core";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { IntakeDraftResult } from "../draft-actions";
import type { InputStep, IntakeWhen, IntakeWho } from "./intake-state";
import { type DraftDisplay, guessesOf, type MessageDraft, readRows } from "./message-draft";
import type { WhenFormValues } from "./when-form-schema";

const wallTime = ({ instant, timeZone }: { instant: Date | undefined; timeZone: string }) =>
  instant ? (toLocalInputValue({ date: instant, timeZone }).split("T")[1] ?? "") : "";

/** Step 2 as read; any part may be empty. */
function whenValues({ draft, timeZone }: { draft: TicketDraft; timeZone: string }): WhenFormValues {
  return {
    date: draft.date?.value ?? "",
    from: wallTime({ instant: draft.start?.value, timeZone }),
    to: wallTime({ instant: draft.end?.value, timeZone }),
    guests: draft.headcount ? String(draft.headcount.value) : "",
  };
}

/** Step 2's answer when the message gives all of it. */
function completeWhen({ values }: { values: WhenFormValues }): IntakeWhen | null {
  const guests = Number(values.guests);
  const filled = values.date && values.from && values.to && values.from !== values.to;
  return filled && Number.isInteger(guests) && guests > 0 ? { ...values, guests } : null;
}

/** The wish, the notes and the needs as the booking note starts. */
function noteOf({ draft, needsLabel }: { draft: TicketDraft; needsLabel: string }): string {
  const needs = draft.needs.map(({ value, count }) => `${value} × ${count}`).join(", ");
  const parts = [draft.wish?.value, draft.notes?.value, needs ? `${needsLabel}: ${needs}` : ""];
  return parts.filter(Boolean).join("\n");
}

export type ApplyMessageDraftInput = {
  result: IntakeDraftResult;
  display: DraftDisplay;
  /** "Needs", localised, for the note. */
  needsLabel: string;
};

export type AppliedDraft = { who: IntakeWho | null; when: IntakeWhen | null; draft: MessageDraft };

/**
 * What reading fills (spec "0 · Start from a message"): the customer and contact when both were
 * matched (else the search starts from the company or sender), step 2 when it is complete (else
 * prefilled), the suggested package, the note, and every guessed value as a question.
 */
export function applyMessageDraft({
  result,
  display,
  needsLabel,
}: ApplyMessageDraftInput): AppliedDraft {
  const { draft, customer, contact } = result;
  const who =
    customer && contact
      ? {
          customerId: customer.id,
          customerName: customer.name,
          contactId: contact.id,
          contactName: contact.name,
        }
      : null;
  const values = whenValues({ draft, timeZone: display.timeZone });
  const when = completeWhen({ values });
  const rows = readRows({ draft, display });
  const fromMessage: InputStep[] = [];
  if (who) fromMessage.push("who");
  if (when) fromMessage.push("when");
  if (draft.templateId) fromMessage.push("package");
  const search = who ? null : (draft.company?.value ?? draft.sender?.value ?? null);
  return {
    who,
    when,
    draft: {
      ...{ read: rows, guesses: guessesOf({ rows }), fromMessage, templateId: draft.templateId },
      ...{ search, note: noteOf({ draft, needsLabel }), when: values },
    },
  };
}
