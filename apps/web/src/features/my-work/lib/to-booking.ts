import { toZonedParts } from "@bibi/core/schemas";
import type { CardIssue, PinnedBooking } from "@bibi/ui";
import type { MyWorkCardWireish } from "../ui/my-work-wireish";

const HOLDS = { HARD: "hard", SOFT: "soft" } as const;

const clock = ({ instant, timeZone }: { instant: Date | string; timeZone: string }) => {
  const { hour, minute } = toZonedParts({ instant: new Date(instant), timeZone }).time;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export type ToBookingInput = {
  card: MyWorkCardWireish;
  timeZone: string;
  /** The card's flags in words, shown as badges in its header. */
  issues?: readonly CardIssue[];
};

/**
 * A My work card as a calendar booking, so it renders and pins like one (spec: home): the order's
 * day as the span, its places as the asset, the day's hold as its state (drawn as the time's mark; the order's
 * status apart, in its own colour), blocked
 * when a hard hold overlaps it. No value: My work shows no money.
 */
export function toBooking({ card, timeZone, issues }: ToBookingInput): PinnedBooking {
  const place = card.places?.join(", ") || null;
  return {
    id: card.key,
    orderId: card.orderId,
    name: card.title ?? card.customerName ?? `#${card.reference}`,
    type: "",
    place,
    assetId: card.key,
    ...(place ? { assetName: place } : {}),
    date: card.day,
    start: clock({ instant: card.startsAt, timeZone }),
    end: clock({ instant: card.endsAt, timeZone }),
    setupMinutes: 0,
    teardownMinutes: 0,
    state: {
      name: "",
      color: "var(--muted-foreground)",
      ink: "var(--primary-foreground)",
      hold: card.hold ? HOLDS[card.hold] : "none",
    },
    status: card.status,
    blocked: card.flags.some((flag) => flag.kind === "HARD_CLASH"),
    ...(issues?.length ? { issues } : {}),
    quantity: 1,
    order: String(card.reference),
    reference: String(card.reference),
    customer: card.customerName,
    ...(card.headcount ? { headcount: card.headcount } : {}),
  };
}
