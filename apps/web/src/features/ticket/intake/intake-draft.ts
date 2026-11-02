import { DraftSchema } from "./draft-schema";
import type { IntakeState } from "./intake-state";

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
  return JSON.stringify({ version: 2, state });
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
