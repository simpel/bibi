import { DEFAULT_CURRENCY } from "../../number/number-formats";
import type { OperationContext } from "../../operations/types";
import { visibleTo } from "../../shared/visible-to";
import type { LineDto } from "../line/schema";
import { lineAmounts } from "../quote/line-totals";
import { type DetailSources, loadDetailSources } from "./detail-sources";
import type { CalendarBlockDto, CalendarDetails } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;
type Block = Pick<CalendarBlockDto, "lineId" | "ticketId">;

/** The line's total excl. VAT (ADR 0052), when it has a quantity and a price. */
function lineValueOf({ line }: { line: LineDto | undefined }) {
  if (!line || line.effectiveQuantity === null || line.effectiveUnitPriceMinor === null) {
    return null;
  }
  return lineAmounts({
    quantity: line.effectiveQuantity,
    unitPriceMinor: line.effectiveUnitPriceMinor,
    discountPercent: line.effectiveDiscountPercent,
    vatRatePercent: line.effectiveVatRatePercent ?? 0,
  }).totalExclVatMinor;
}

/** Who to reach: the line's own assignee when the caller sees the program, else the ticket's. */
function contactOf({ context, sources, lineId, ticketId }: DetailInput) {
  const own = visibleTo({ context, feature: "program", value: sources.assignees.get(lineId) });
  if (own) return { ...own, via: "LINE" as const };
  const ticket = sources.assignees.get(ticketId);
  return ticket ? { ...ticket, via: "TICKET" as const } : null;
}

type DetailInput = { context: Context; sources: DetailSources; lineId: string; ticketId: string };

/** The units allocated to the line, persons and equipment alike (ADR 0059, 0068). */
const staffOf = ({ sources, lineId }: Pick<DetailInput, "sources" | "lineId">) =>
  sources.staff.flatMap(({ lineId: of, unit }) =>
    of === lineId && unit
      ? [
          {
            itemId: unit.id,
            name: unit.memberProfileItem?.memberProfile.member.user.name ?? unit.name,
            type: unit.entityType.name,
            person: !!unit.memberProfileItem,
          },
        ]
      : [],
  );

function detailsOf({ context, sources, lineId, ticketId }: DetailInput): CalendarDetails {
  const line = sources.lines.get(lineId);
  const ticket = sources.tickets.get(ticketId);
  const program = { context, feature: "program" as const };
  const customer = { context, feature: "customer" as const };
  return {
    customer: ticket ? visibleTo({ ...customer, value: ticket.customer.name }) : null,
    client: ticket?.contact ? visibleTo({ ...customer, value: ticket.contact }) : null,
    headcount: ticket ? (ticket.guaranteedHeadcount ?? ticket.estimatedHeadcount) : null,
    quantity: visibleTo({ ...program, value: line?.effectiveQuantity ?? null }),
    valueMinor: visibleTo({ ...program, value: lineValueOf({ line }) }),
    currency: DEFAULT_CURRENCY,
    note: visibleTo({ ...program, value: line?.note ?? null }),
    contact: contactOf({ context, sources, lineId, ticketId }),
    staff: visibleTo({ ...program, value: staffOf({ sources, lineId }) }) ?? [],
  };
}

/**
 * Each line block's details, joined for the calendar (ADR 0071): customer and contact gated by
 * `customer:read`, the line's value, note, assignee and staff by `program:read`.
 */
export async function loadDetails({ context, blocks }: { context: Context; blocks: Block[] }) {
  const lineIds = [...new Set(blocks.flatMap((block) => block.lineId ?? []))];
  const ticketIds = [...new Set(blocks.flatMap((block) => block.ticketId ?? []))];
  const sources = await loadDetailSources({ context, lineIds, ticketIds });
  return ({ lineId, ticketId }: Block) =>
    lineId && ticketId ? detailsOf({ context, sources, lineId, ticketId }) : null;
}
