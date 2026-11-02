import { PlainDateStringSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { DRAFT_FIELDS } from "./message-draft";

const Id = z.string().min(1);
const Time = z.string().regex(/^\d{2}:\d{2}$/);
const Instant = z.iso.datetime();
const Count = z.number().int().min(0);
const Fields = z.record(z.string(), z.unknown());

const AnswersSchema = z.object({
  guests: z.enum(["CHANGE", "KEEP"]).optional(),
  end: z.enum(["EXTEND", "KEEP"]).optional(),
  clash: z.enum(["MOVE", "PREBOOK"]).optional(),
});

const DraftLineSchema = z.object({
  key: Id,
  entityTypeId: Id,
  name: z.string(),
  itemId: Id.nullable(),
  setupId: Id.nullable(),
  startsAt: Instant.nullable(),
  endsAt: Instant.nullable(),
  quantity: Count.nullable(),
  unitPriceMinor: Count.nullable(),
  discountPercent: z.number().min(0).max(100).nullable(),
  note: z.string().nullable(),
  options: z.array(z.object({ itemId: Id, quantity: Count.nullable() })),
  needs: z.array(z.object({ entityTypeId: Id, vocabularyValueId: Id, quantity: Count })),
  fields: Fields,
});

const ReviewSchema = z.object({
  lines: z.array(DraftLineSchema),
  plannedStart: Instant.nullable(),
  pickKey: z.string(),
  note: z.string(),
  ticketTypeId: Id.nullable(),
  ticketFields: Fields,
  saveAsPackage: z.boolean(),
  packageName: z.string(),
  more: z.object({
    assigneeId: Id.nullable(),
    holdsUntil: Instant.nullable(),
    estimatedValueMinor: Count.nullable(),
  }),
  accepted: z.array(z.string()),
});

const Step = z.enum(["who", "when", "package"]);

const WhoSchema = z.object({
  customerId: Id,
  customerName: z.string(),
  contactId: Id,
  contactName: z.string(),
});

/** What a read message left on the intake (ADR 0084, `message-draft.ts`). */
const MessageDraftSchema = z.object({
  read: z.array(
    z.object({
      field: z.enum(DRAFT_FIELDS),
      value: z.string(),
      quote: z.string(),
      guessed: z.boolean(),
    }),
  ),
  guesses: z.array(
    z.object({ key: z.string(), field: z.string(), value: z.string(), step: Step.nullable() }),
  ),
  // Version 2 had no preselection (it filled `who` instead) and a `fromMessage` list, dropped.
  who: WhoSchema.nullable().default(null),
  templateId: Id.nullable(),
  search: z.string().nullable(),
  note: z.string(),
  when: z.object({ date: z.string(), from: z.string(), to: z.string(), guests: z.string() }),
});

/** The version `serializeDraft` writes; 2 is still read (see `open`). */
export const DRAFT_VERSION = 3;

/**
 * What a stored draft must look like; anything else (an older shape, edited storage) is dropped.
 * Version 2 could be open on step 0 (`message`), which is now a dialog: it opens step 1.
 */
export const DraftSchema = z.object({
  version: z.union([z.literal(2), z.literal(DRAFT_VERSION)]),
  state: z.object({
    open: z
      .enum(["message", "who", "when", "package", "review"])
      .transform((open) => (open === "message" ? "who" : open)),
    who: WhoSchema.nullable(),
    when: z.object({ date: PlainDateStringSchema, from: Time, to: Time, guests: Count }).nullable(),
    pick: z
      .discriminatedUnion("kind", [
        z.object({ kind: z.literal("ONE_OFF") }),
        z.object({
          kind: z.literal("PACKAGE"),
          templateId: Id,
          name: z.string(),
          answers: AnswersSchema,
        }),
      ])
      .nullable(),
    review: ReviewSchema.nullable(),
    intakeKey: Id,
    inboundMessageId: Id.nullable().optional(),
    draft: MessageDraftSchema.nullable().optional(),
  }),
});
