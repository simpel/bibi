import { PlainDateStringSchema } from "@bibi/core/schemas";
import { z } from "zod";
import type { IntakeState } from "./intake-state";

const Id = z.string().min(1);
const Time = z.string().regex(/^\d{2}:\d{2}$/);

const AnswersSchema = z.object({
  guests: z.enum(["CHANGE", "KEEP"]).optional(),
  end: z.enum(["EXTEND", "KEEP"]).optional(),
  clash: z.enum(["MOVE", "PREBOOK"]).optional(),
});

/** What a stored draft must look like; anything else (an older shape, edited storage) is dropped. */
const DraftSchema = z.object({
  version: z.literal(1),
  state: z.object({
    open: z.enum(["who", "when", "package", "review"]),
    who: z
      .object({ customerId: Id, customerName: z.string(), contactId: Id, contactName: z.string() })
      .nullable(),
    when: z
      .object({
        date: PlainDateStringSchema,
        from: Time,
        to: Time,
        guests: z.number().int().min(0),
      })
      .nullable(),
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
  }),
});

export type DraftKeyInput = { organizationId: string; userId: string };

/** One draft per organization and member (spec "Local draft"). */
export function draftKey({ organizationId, userId }: DraftKeyInput): string {
  return `bibi.ticketIntake.${organizationId}.${userId}`;
}

/** A draft worth offering: at least the customer is chosen. */
export function isWorthKeeping({ state }: { state: IntakeState }): boolean {
  return state.who !== null;
}

export function serializeDraft({ state }: { state: IntakeState }): string {
  return JSON.stringify({ version: 1, state });
}

/** The stored draft, or null when there is none or it does not parse. */
export function parseDraft({ text }: { text: string | null }): IntakeState | null {
  if (!text) return null;
  try {
    const parsed = DraftSchema.safeParse(JSON.parse(text));
    return parsed.success && isWorthKeeping({ state: parsed.data.state })
      ? parsed.data.state
      : null;
  } catch {
    return null;
  }
}
