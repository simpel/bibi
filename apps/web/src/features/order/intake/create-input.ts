import type {
  CreateDraftLine,
  OrderCreateInput,
  OrderTemplateCreateInput,
  PreviewDraftLine,
  PreviewLine,
} from "@bibi/core";
import { toAddOnInput } from "./draft-add-ons";
import type { DraftLine } from "./draft-line";
import type { IntakePeriod } from "./intake-period";
import type { IntakePick, IntakeWhen, IntakeWho } from "./intake-state";
import { linesTotalMinor } from "./line-cost";
import type { IntakeReview } from "./review-state";

const date = ({ at }: { at: string | null }) => (at === null ? null : new Date(at));

/** A draft line as `order.previewLines` plans it, with its add-ons (ADR 0088). */
export function toPreviewLine({ line }: { line: DraftLine }): PreviewDraftLine {
  return {
    ...{ entityTypeId: line.entityTypeId, name: line.name },
    ...{ itemId: line.itemId, layoutId: line.layoutId, quantity: line.quantity },
    ...{ startsAt: date({ at: line.startsAt }), endsAt: date({ at: line.endsAt }) },
    ...{ unitPriceMinor: line.unitPriceMinor, discountPercent: line.discountPercent },
    fields: line.fields,
    addOns: line.addOns.map((addOn) => toAddOnInput({ addOn })),
  };
}

/** A draft line as `order.create` writes it: with its note, choices (ADR 0082) and needs. */
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
  /** The package's order type, or the one-off's chosen type. */
  orderTypeId: string;
  intakeKey: string;
  /** The inbox message the order is made from (ADR 0085). */
  inboundMessageId?: string | null | undefined;
  /** Values were read from a message (ADR 0084): the order's audit says so. */
  draftedFromMessage?: boolean;
  /** The assignee when none is chosen: the creating member. */
  userId: string | null;
  /** The preview's lines: their total is the order's estimated value. */
  planned?: readonly PreviewLine[] | null;
};

/** The one `order.create` call Create makes (ADR 0081): the order with every line. */
export function toCreateInput({
  who,
  when,
  period,
  pick,
  review,
  orderTypeId,
  intakeKey,
  inboundMessageId,
  draftedFromMessage = false,
  userId,
  planned = null,
}: ToCreateInputInput): OrderCreateInput {
  const { more } = review;
  return {
    entityTypeId: orderTypeId,
    ...{ customerId: who.customerId, contactId: who.contactId },
    ...{ desiredStartsAt: period.startsAt, desiredEndsAt: period.endsAt },
    estimatedHeadcount: when.guests,
    assigneeId: more.assigneeId ?? userId,
    holdsUntil: date({ at: more.holdsUntil }),
    estimatedValueMinor: linesTotalMinor({ planned }),
    fields: review.orderFields,
    // Left empty, the title is generated after the create.
    ...(review.title.trim() ? { title: review.title.trim() } : {}),
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
  orderTypeId: string;
  /** The status its orders start in: the entry status the preview planned for. */
  statusId: string;
  review: IntakeReview;
  period: IntakePeriod;
};

/** A template line: offset from the order's start; an untimed line spans the whole order. */
function templateLine({ line, period }: { line: DraftLine; period: IntakePeriod }) {
  const start = period.startsAt.getTime();
  const from = line.startsAt ? new Date(line.startsAt).getTime() : start;
  const to = line.endsAt ? new Date(line.endsAt).getTime() : period.endsAt.getTime();
  return {
    ...{ entityTypeId: line.entityTypeId, name: line.name },
    ...{ itemId: line.itemId, layoutId: line.layoutId, quantity: line.quantity },
    offsetMinutes: Math.max(0, Math.round((from - start) / MINUTE)),
    durationMinutes: Math.max(1, Math.round((to - from) / MINUTE)),
  };
}

/** "Also save these lines as a package": `orderTemplate.create` from the one-off's lines. */
export function toTemplateInput({
  name,
  orderTypeId,
  statusId,
  review,
  period,
}: ToTemplateInputInput): OrderTemplateCreateInput {
  return {
    name: name.trim(),
    entityTypeId: orderTypeId,
    statusId,
    fields: review.orderFields,
    lines: review.lines.map((line) => templateLine({ line, period })),
  };
}
