import type { ConcernReason } from "@bibi/core/schemas";
import type { CardSurface } from "@bibi/ui";

/**
 * Following is only an order the member chose to follow (spec: home). Work that reaches them
 * another way (a responsibility, often by default, an item, a run sheet) is theirs, not followed.
 */
const FOLLOWED: ReadonlySet<ConcernReason> = new Set(["FOLLOWER"]);

export type CardSurfaceInput = {
  card: {
    startsAt: Date | string;
    endsAt: Date | string;
    hold: "HARD" | "SOFT" | null;
    reasons: readonly ConcernReason[];
  };
  now: Date;
};

/** Now inside the card's span: the footer's pulsing Live. */
export const isLive = ({ card, now }: CardSurfaceInput): boolean =>
  new Date(card.startsAt).getTime() <= now.getTime() &&
  now.getTime() < new Date(card.endsAt).getTime();

/**
 * The card's surface facts (spec: home, Tone), each its own cue and combined freely: an order the
 * member only follows, and over. Preliminary and issues are badges with the attention border,
 * which the card derives from its booking.
 */
export const cardSurface = ({ card, now }: CardSurfaceInput): CardSurface => ({
  following: card.reasons.length > 0 && card.reasons.every((reason) => FOLLOWED.has(reason)),
  done: new Date(card.endsAt).getTime() <= now.getTime(),
});
