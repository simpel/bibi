import type { ConcernReason, MyWorkFlag } from "@bibi/core/schemas";
import type { BookingTone } from "@bibi/ui";

/** Where the member acts, not only follows (spec: home): assignee, responsibility, staffed. */
const ACTING: ReadonlySet<ConcernReason> = new Set(["ASSIGNEE", "RESPONSIBILITY", "STAFFED"]);

export type CardToneInput = {
  card: {
    startsAt: Date | string;
    endsAt: Date | string;
    hold: "HARD" | "SOFT" | null;
    reasons: readonly ConcernReason[];
    flags: readonly Pick<MyWorkFlag, "kind" | "runSheetStatus">[];
  };
  now: Date;
};

const isConflict = ({ flag }: { flag: CardToneInput["card"]["flags"][number] }) =>
  flag.kind === "HARD_CLASH" || flag.runSheetStatus === "BLOCKED";

/**
 * The card's tone (spec: home), strongest first: conflict, action (a flag is open, whether the
 * member acts or follows), live (now inside its span), done (over), then following (need-to-know only), tentative
 * (soft holds only) or confirmed.
 */
export function cardTone({ card, now }: CardToneInput): BookingTone {
  const starts = new Date(card.startsAt).getTime();
  const ends = new Date(card.endsAt).getTime();
  const acting = card.reasons.some((reason) => ACTING.has(reason));
  if (card.flags.some((flag) => isConflict({ flag }))) return "conflict";
  if (card.flags.length > 0) return "action";
  if (starts <= now.getTime() && now.getTime() < ends) return "live";
  if (ends <= now.getTime()) return "done";
  if (!acting) return "following";
  return card.hold === "SOFT" ? "tentative" : "confirmed";
}
