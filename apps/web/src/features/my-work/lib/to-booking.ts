import { toZonedParts } from "@bibi/core/schemas";
import type { PinnedBooking } from "@bibi/ui";
import type { MyWorkCardWireish } from "../ui/my-work-wireish";

const HOLDS = { HARD: "hard", SOFT: "soft" } as const;

const clock = ({ instant, timeZone }: { instant: Date | string; timeZone: string }) => {
  const { hour, minute } = toZonedParts({ instant: new Date(instant), timeZone }).time;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export type ToBookingInput = { card: MyWorkCardWireish; timeZone: string };

/**
 * A My work card as a calendar booking, so it renders and pins like one (spec: home): the order's
 * day as the span, its places as the asset, its status as the state with the day's hold, blocked
 * when a hard hold overlaps it. No value: My work shows no money.
 */
export function toBooking({ card, timeZone }: ToBookingInput): PinnedBooking {
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
      name: card.status?.name ?? "",
      color: card.status?.color ?? "var(--muted-foreground)",
      ink: "var(--primary-foreground)",
      hold: card.hold ? HOLDS[card.hold] : "none",
    },
    blocked: card.flags.some((flag) => flag.kind === "HARD_CLASH"),
    quantity: 1,
    order: String(card.reference),
    reference: String(card.reference),
    customer: card.customerName,
    ...(card.headcount ? { headcount: card.headcount } : {}),
  };
}
