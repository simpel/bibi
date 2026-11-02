import { getLogger } from "@bibi/logger";
import { ok, type Result } from "../../../errors/result";
import type { OperationContext } from "../../../operations/types";
import { getExtract } from "../../ticket-draft/operations";
import type { TicketDto } from "../schema";
import { loadTicket } from "../to-ticket-dto";
import { ModelTitleSchema, TITLE_INSTRUCTIONS, titlePrompt } from "./title-prompt";

const FEATURE = "ticket.title";
/** A title is a few words, and the create waits for it. */
const LIMITS = { maxOutputTokens: 64, totalTimeoutMs: 8_000 } as const;
const MAX_LINES = 20;
const MAX_NOTE = 500;

type GenerateTitleInput = { context: OperationContext; ticket: TicketDto };

/** The ticket's customer, type and line names, the text the model names it from. */
async function loadBooking({ context, ticket }: GenerateTitleInput) {
  const [customer, type, lines] = await Promise.all([
    context.db.customer.findFirst({ where: { id: ticket.customerId }, select: { name: true } }),
    context.db.entityType.findFirst({ where: { id: ticket.entityTypeId }, select: { name: true } }),
    context.db.line.findMany({
      where: { ticketId: ticket.id, parentLineId: null },
      select: { name: true },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
      take: MAX_LINES,
    }),
  ]);
  return titlePrompt({
    customer: customer?.name ?? null,
    type: type?.name ?? null,
    headcount: ticket.guaranteedHeadcount ?? ticket.estimatedHeadcount,
    lines: lines.map(({ name }) => name),
    note: ticket.note?.slice(0, MAX_NOTE) ?? null,
  });
}

/**
 * Names a ticket that has no title (feature `ticket.title`, a small model): after the create's
 * commit, so the model is never inside its transaction. Best effort: no model, a failed call or
 * a title someone set meanwhile leave the ticket as it is.
 */
export async function generateTitle({ context, ticket }: GenerateTitleInput): Promise<TicketDto> {
  if (ticket.title) return ticket;
  const prompt = await loadBooking({ context, ticket });
  const raw = await getExtract()({
    ...{ feature: FEATURE, instructions: TITLE_INSTRUCTIONS, prompt },
    ...{ schema: ModelTitleSchema, limits: LIMITS },
  });
  const parsed = raw.ok ? ModelTitleSchema.safeParse(raw.value) : null;
  getLogger().info({ event: "ticket.titleGenerated", outcome: parsed?.success ? "ok" : "none" });
  if (!parsed?.success) return ticket;
  const { title } = parsed.data;
  const written = await context.db.ticket.updateMany({
    where: { id: ticket.id, title: null },
    data: { title },
  });
  if (written.count === 0) return ticket;
  const after = (await loadTicket({ context, id: ticket.id })) ?? { ...ticket, title };
  context.recordChange({ entityId: ticket.id, before: ticket, after });
  return after;
}

/** The `external` step of the ticket creates: the committed ticket, named when it had no title. */
export const titleAfterCreate = async ({
  output,
  context,
}: {
  output: TicketDto;
  context: OperationContext;
}): Promise<Result<TicketDto>> => ok({ value: await generateTitle({ context, ticket: output }) });
