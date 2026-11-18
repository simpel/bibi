import { toIsoDate, toZonedParts } from "@bibi/core/schemas";
import type { CardIssue, PinnedBooking } from "@bibi/ui";
import type { BoardCard } from "./kanban-model";

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/** An instant as the day (`YYYY-MM-DD`) and clock (`HH:mm`) in the zone. */
const partsOf = ({ instant, timeZone }: { instant: Date | string; timeZone: string }) => {
  const { date, time } = toZonedParts({ instant: new Date(instant), timeZone });
  return {
    day: toIsoDate({ date }),
    clock: `${pad({ value: time.hour })}:${pad({ value: time.minute })}`,
  };
};

export type BoardCardPinInput = { card: BoardCard; timeZone: string; issues: readonly CardIssue[] };

/**
 * A board card as a calendar booking, so it pins to the tray like the calendar and My work cards:
 * the order's desired span, the strongest hold as its state (drawn as the time's mark), its status apart.
 */
export function boardCardPin({ card, timeZone, issues }: BoardCardPinInput): PinnedBooking {
  const start = card.startsAt ? partsOf({ instant: card.startsAt, timeZone }) : null;
  const end = card.endsAt ? partsOf({ instant: card.endsAt, timeZone }) : null;
  const hold = card.bookedLines ? "hard" : card.heldLines ? "soft" : "none";
  return {
    id: card.id,
    orderId: card.id,
    name: card.title,
    type: card.typeName,
    place: null,
    assetId: card.id,
    date: start?.day ?? "",
    start: start?.clock ?? "",
    end: end?.clock ?? "",
    setupMinutes: 0,
    teardownMinutes: 0,
    state: {
      name: "",
      color: "var(--muted-foreground)",
      ink: "var(--primary-foreground)",
      hold,
    },
    status: { name: card.statusName, color: card.statusColor ?? "" },
    blocked: card.flags.some((flag) => flag.kind === "HARD_CLASH"),
    ...(issues.length ? { issues } : {}),
    quantity: 1,
    order: String(card.reference),
    reference: String(card.reference),
    customer: card.customerName,
    ...(card.quantity ? { headcount: card.quantity } : {}),
  };
}
