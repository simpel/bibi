import type { TicketDraft } from "@bibi/core";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { IntakeDraftResult } from "../draft-actions";
import type { IntakeWho } from "./intake-state";
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

/** The matched customer with its matched contact, or null when either is missing. */
function whoOf({ result }: { result: IntakeDraftResult }): IntakeWho | null {
  const { customer, contact } = result;
  if (!customer || !contact) return null;
  return {
    ...{ customerId: customer.id, customerName: customer.name },
    ...{ contactId: contact.id, contactName: contact.name },
  };
}

/**
 * What reading prefills (spec "Reading a message"), without completing a step: the customer
 * and contact when both were matched (else the search starts from the company or sender), step
 * 2's fields, the suggested package, the note, and every guessed value as a question.
 */
export function applyMessageDraft({
  result,
  display,
  needsLabel,
}: ApplyMessageDraftInput): MessageDraft {
  const { draft } = result;
  const who = whoOf({ result });
  const rows = readRows({ draft, display });
  const search = who ? null : (draft.company?.value ?? draft.sender?.value ?? null);
  return {
    ...{ read: rows, guesses: guessesOf({ rows }), who, templateId: draft.templateId },
    ...{
      search,
      note: noteOf({ draft, needsLabel }),
      when: whenValues({ draft, timeZone: display.timeZone }),
    },
  };
}
