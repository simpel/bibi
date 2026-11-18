import type { MyWorkFlag } from "@bibi/core/schemas";
import type { CardSurface } from "@bibi/ui";
import { flagAttention } from "@/features/my-work/lib/flag-level";

export type BoardCardSurfaceInput = {
  card: {
    heldLines: number | null;
    bookedLines: number | null;
    following: boolean;
    endsAt: Date | string | null;
    flags: readonly Pick<MyWorkFlag, "kind" | "runSheetStatus">[];
  };
  now: Date;
};

/**
 * A board card's surface, the same cues as My work (spec: home, Tone): following when the caller
 * only follows it, done once its end has passed, and the attention border: red or amber from its
 * flags, amber when its held lines are all preliminary (soft holds).
 */
/** Every held line is a preliminary (soft) hold. */
export const isTentative = ({ card }: Pick<BoardCardSurfaceInput, "card">) =>
  (card.heldLines ?? 0) > 0 && (card.bookedLines ?? 0) === 0;

export const boardCardSurface = ({ card, now }: BoardCardSurfaceInput): CardSurface => ({
  following: card.following,
  done: card.endsAt !== null && new Date(card.endsAt).getTime() <= now.getTime(),
  attention: flagAttention({ flags: card.flags }) ?? (isTentative({ card }) ? "warning" : null),
});
