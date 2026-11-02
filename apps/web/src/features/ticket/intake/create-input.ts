import type {
  CreateDraftLine,
  PreviewDraftLine,
  PreviewLine,
  TicketCreateInput,
  TicketTemplateCreateInput,
} from "@bibi/core";
import type { DraftLine } from "./draft-line";
import type { IntakePeriod } from "./intake-period";
import type { IntakePick, IntakeWhen, IntakeWho } from "./intake-state";
import { linesTotalMinor } from "./line-cost";
import type { IntakeReview } from "./review-state";

const date = ({ at }: { at: string | null }) => (at === null ? null : new Date(at));

/** A draft line as `ticket.previewLines` plans it. */
export function toPreviewLine({ line }: { line: DraftLine }): PreviewDraftLine {
  return {
    ...{ entityTypeId: line.entityTypeId, name: line.name },
    ...{ itemId: line.itemId, setupId: line.setupId, quantity: line.quantity },
    ...{ startsAt: date({ at: line.startsAt }), endsAt: date({ at: line.endsAt }) },
    ...{ unitPriceMinor: line.unitPriceMinor, discountPercent: line.discountPercent },
    fields: line.fields,
  };
}

/** A draft line as `ticket.create` writes it: with its note, choices (ADR 0082) and needs. */
export function toCreateLine({ line }: { line: DraftLine }): CreateDraftLine {
  return {
    ...toPreviewLine({ line }),
    note: line.note,
    options: line.options.map(({ itemId, quantity }) =>
      quantity === null ? { itemId } : { itemId, quantity },
    ),
    requirements: line.needs.map(({ entityTypeId, vocabularyValueId, quantity }) => ({
      ...{ entityTypeId, vocabularyValueId, quantity },
    })),
  };
}

export type ToCreateInputInput = {
  who: IntakeWho;
  when: IntakeWhen;
  period: IntakePeriod;
  pick: IntakePick;
  review: IntakeReview;
  /** The package's ticket type, or the one-off's chosen type. */
  ticketTypeId: string;
  intakeKey: string;
  /** The inbox message the ticket is made from (ADR 0085). */
  inboundMessageId?: string | null | undefined;
  /** Values were read from a message (ADR 0084): the ticket's audit says so. */
  draftedFromMessage?: boolean;
  /** The assignee when none is chosen: the creating member. */
  userId: string | null;
  /** The preview's lines: their total is the ticket's estimated value. */
  planned?: readonly PreviewLine[] | null;
};

/** The one `ticket.create` call Create makes (ADR 0081): the ticket with every line. */
export function toCreateInput({
  who,
  when,
  period,
  pick,
  review,
  ticketTypeId,
  intakeKey,
  inboundMessageId,
  draftedFromMessage = false,
  userId,
  planned = null,
}: ToCreateInputInput): TicketCreateInput {
  const { more } = review;
  return {
    entityTypeId: ticketTypeId,
    ...{ customerId: who.customerId, contactId: who.contactId },
    ...{ desiredStartsAt: period.startsAt, desiredEndsAt: period.endsAt },
    estimatedHeadcount: when.guests,
    assigneeId: more.assigneeId ?? userId,
    holdsUntil: date({ at: more.holdsUntil }),
    estimatedValueMinor: linesTotalMinor({ planned }),
    fields: review.ticketFields,
    note: review.note.trim() === "" ? null : review.note.trim(),
    ...(pick.kind === "PACKAGE" ? { templateId: pick.templateId } : {}),
    lines: review.lines.map((line) => toCreateLine({ line })),
    intakeKey,
    ...(inboundMessageId ? { inboundMessageId } : {}),
    ...(draftedFromMessage ? { draftedFromMessage } : {}),
  };
}

const MINUTE = 60_000;

export type ToTemplateInputInput = {
  name: string;
  ticketTypeId: string;
  /** The status its tickets start in: the entry status the preview planned for. */
  statusId: string;
  review: IntakeReview;
  period: IntakePeriod;
};

/** A template line: offset from the ticket's start; an untimed line spans the whole ticket. */
function templateLine({ line, period }: { line: DraftLine; period: IntakePeriod }) {
  const start = period.startsAt.getTime();
  const from = line.startsAt ? new Date(line.startsAt).getTime() : start;
  const to = line.endsAt ? new Date(line.endsAt).getTime() : period.endsAt.getTime();
  return {
    ...{ entityTypeId: line.entityTypeId, name: line.name },
    ...{ itemId: line.itemId, setupId: line.setupId, quantity: line.quantity },
    offsetMinutes: Math.max(0, Math.round((from - start) / MINUTE)),
    durationMinutes: Math.max(1, Math.round((to - from) / MINUTE)),
  };
}

/** "Also save these lines as a package": `ticketTemplate.create` from the one-off's lines. */
export function toTemplateInput({
  name,
  ticketTypeId,
  statusId,
  review,
  period,
}: ToTemplateInputInput): TicketTemplateCreateInput {
  return {
    name: name.trim(),
    entityTypeId: ticketTypeId,
    statusId,
    fields: review.ticketFields,
    lines: review.lines.map((line) => templateLine({ line, period })),
  };
}
