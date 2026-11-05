import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { visibleTo } from "../../shared/visible-to";
import { loadSlot } from "../assignment/load-assignment";
import { loadColleagues } from "../calendar/detail-sources";
import { savedLineIssues } from "../line/saved-line-issues";
import { LINE_INCLUDE, toLineRecord } from "../line/to-line-record";
import { withEffective } from "../line/with-effective";
import { orderBalance } from "../payment/order-balance";
import { deriveOrderLines } from "../quote/derive-lines";
import { quoteTotals, totalIsFrom } from "../quote/line-totals";
import type { OrderDto } from "./schema";
import type { OrderViewDto, OrderViewPerson } from "./view-schema";

type Context = Pick<OperationContext, "db" | "permissions" | "organizationId">;
type ViewInput = { context: Context; order: OrderDto };
type Joined = Pick<OrderViewDto, "currentStatus" | "customer" | "contact">;

/** The order's status, customer and contact in one query, each gated by its feature (ADR 0071). */
async function loadJoins({ context, order }: ViewInput): Promise<Joined> {
  const row = await context.db.order.findFirst({
    where: { id: order.id },
    select: {
      orderStatus: { select: { id: true, name: true, color: true } },
      customer: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  const customer = { context, feature: "customer" as const };
  return {
    currentStatus: visibleTo({ context, feature: "pipeline", value: row?.orderStatus ?? null }),
    customer: visibleTo({ ...customer, value: row?.customer ?? null }),
    contact: visibleTo({ ...customer, value: row?.contact ?? null }),
  };
}

type People = { assignee: OrderViewPerson | null; followers: OrderViewPerson[] };

/** The main assignee and followers (ADR 0055, the order's own) by name, as colleagues see them. */
async function loadPeople({ context, order }: ViewInput): Promise<People> {
  const slot = { subjectType: "ORDER" as const, subjectId: order.id, responsibilityId: null };
  const main = await loadSlot({ context, ...slot });
  const followerIds = main.followers.map((follower) => follower.userId);
  const userIds = [...new Set([...(main.assigneeId ? [main.assigneeId] : []), ...followerIds])];
  const people = await loadColleagues({ context, userIds });
  const named = userIds.flatMap((userId) => {
    const found = people.get(userId);
    return found ? [[userId, { userId, name: found.name }] as const] : [];
  });
  const byId = new Map(named);
  return {
    assignee: main.assigneeId ? (byId.get(main.assigneeId) ?? null) : null,
    followers: followerIds.flatMap((userId) => byId.get(userId) ?? []),
  };
}

/** Line count, totals as a draft quote counts them (ADR 0052) and open issues (`line.issues`). */
async function loadProgram({ context, order }: ViewInput): Promise<OrderViewDto["program"]> {
  const rows = await context.db.line.findMany({
    where: { orderId: order.id },
    orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    include: LINE_INCLUDE,
  });
  const lines = await withEffective({ context, lines: rows.map((row) => toLineRecord({ row })) });
  const withAvailability = canView({ context, feature: "item" });
  const [issues, derived] = await Promise.all([
    savedLineIssues({ context, statusId: order.statusId, lines, withAvailability }),
    deriveOrderLines({ context, orderIds: [order.id] }),
  ]);
  const priced = (derived.get(order.id) ?? []).map(({ line }) => line);
  const { totalExclVatMinor, totalInclVatMinor } = quoteTotals({ lines: priced });
  return {
    lineCount: lines.length,
    ...{ totalExclVatMinor, totalInclVatMinor },
    totalIsFrom: totalIsFrom({ lines: priced }),
    issueCount: issues.reduce((sum, line) => sum + line.issues.length, 0),
  };
}

/** What is billed, paid and open (ADR 0057); quotes count only with `quote:read`, as on payment. */
async function loadBalance({ context, order }: ViewInput): Promise<OrderViewDto["balance"]> {
  const withQuotes = canView({ context, feature: "quote" });
  const balance = await orderBalance({ context, orderId: order.id, withQuotes });
  const { billedFrom, billedMinor, paidMinor, balanceMinor } = balance;
  return { billedFrom, billedMinor, paidMinor, balanceMinor };
}

export type ViewDetails = Joined & People & Pick<OrderViewDto, "program" | "balance">;

/**
 * Everything `order.view` joins onto the order (ADR 0071, 0097), in a fixed number of queries.
 * Program and payment data are not even read without that feature's `read`.
 */
export async function loadViewDetails({ context, order }: ViewInput): Promise<ViewDetails> {
  const [joins, people, program, balance] = await Promise.all([
    loadJoins({ context, order }),
    loadPeople({ context, order }),
    canView({ context, feature: "program" }) ? loadProgram({ context, order }) : null,
    canView({ context, feature: "payment" }) ? loadBalance({ context, order }) : null,
  ]);
  return { ...joins, ...people, program, balance };
}
