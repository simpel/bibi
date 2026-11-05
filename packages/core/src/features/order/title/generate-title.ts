import { getLogger } from "@bibi/logger";
import { ok, type Result } from "../../../errors/result";
import type { OperationContext } from "../../../operations/types";
import { getExtract } from "../../order-draft/operations";
import type { OrderDto } from "../schema";
import { loadOrder } from "../to-order-dto";
import { ModelTitleSchema, TITLE_INSTRUCTIONS, titlePrompt } from "./title-prompt";

const FEATURE = "order.title";
/** A title is a few words, and the create waits for it. */
const LIMITS = { maxOutputTokens: 64, totalTimeoutMs: 8_000 } as const;
const MAX_LINES = 20;
const MAX_NOTE = 500;

type GenerateTitleInput = { context: OperationContext; order: OrderDto };

/** The order's customer, type and line names, the text the model names it from. */
async function loadBooking({ context, order }: GenerateTitleInput) {
  const [customer, type, lines] = await Promise.all([
    context.db.customer.findFirst({ where: { id: order.customerId }, select: { name: true } }),
    context.db.entityType.findFirst({ where: { id: order.entityTypeId }, select: { name: true } }),
    context.db.line.findMany({
      where: { orderId: order.id, parentLineId: null },
      select: { name: true },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
      take: MAX_LINES,
    }),
  ]);
  return titlePrompt({
    customer: customer?.name ?? null,
    type: type?.name ?? null,
    headcount: order.guaranteedHeadcount ?? order.estimatedHeadcount,
    lines: lines.map(({ name }) => name),
    note: order.note?.slice(0, MAX_NOTE) ?? null,
  });
}

/**
 * Names an order that has no title (feature `order.title`, a small model): after the create's
 * commit, so the model is never inside its transaction. Best effort: no model, a failed call or
 * a title someone set meanwhile leave the order as it is.
 */
export async function generateTitle({ context, order }: GenerateTitleInput): Promise<OrderDto> {
  if (order.title) return order;
  const prompt = await loadBooking({ context, order });
  const raw = await getExtract()({
    ...{ feature: FEATURE, instructions: TITLE_INSTRUCTIONS, prompt },
    ...{ schema: ModelTitleSchema, limits: LIMITS },
  });
  const parsed = raw.ok ? ModelTitleSchema.safeParse(raw.value) : null;
  getLogger().info({ event: "order.titleGenerated", outcome: parsed?.success ? "ok" : "none" });
  if (!parsed?.success) return order;
  const { title } = parsed.data;
  const written = await context.db.order.updateMany({
    where: { id: order.id, title: null },
    data: { title },
  });
  if (written.count === 0) return order;
  const after = (await loadOrder({ context, id: order.id })) ?? { ...order, title };
  context.recordChange({ entityId: order.id, before: order, after });
  return after;
}

/** The `external` step of the order creates: the committed order, named when it had no title. */
export const titleAfterCreate = async ({
  output,
  context,
}: {
  output: OrderDto;
  context: OperationContext;
}): Promise<Result<OrderDto>> => ok({ value: await generateTitle({ context, order: output }) });
