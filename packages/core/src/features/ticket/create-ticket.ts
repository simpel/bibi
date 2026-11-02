import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { attachMessage } from "../inbound-message/attach-message";
import { createWithLines } from "./create-with-lines";
import { checkIntakeAccess, checkTemplate, findIntake } from "./intake-checks";
import { checkCreateLines } from "./intake-refs";
import type { TicketCreateInput, TicketDto } from "./schema";
import { loadTicket } from "./to-ticket-dto";

export type CreateTicketInput = { context: OperationContext; input: TicketCreateInput };

/** The ticket an earlier create with the input's `intakeKey` made, or null to create one. */
async function earlier({ context, input }: CreateTicketInput): Promise<Result<TicketDto | null>> {
  const { intakeKey, customerId } = input;
  if (!intakeKey) return ok({ value: null });
  const found = await findIntake({ context, customerId, intakeKey });
  if (!found.ok) return found;
  if (found.value === null) return ok({ value: null });
  const ticket = await loadTicket({ context, id: found.value });
  return ticket ? ok({ value: ticket }) : notFound({ entity: "Ticket" });
}

/**
 * `ticket.create` (ADR 0081 decisions 9 and 11): the permissions of the parts given, then the
 * ticket an earlier call with the same `intakeKey` made (returned as is, nothing recorded), the
 * template and every id the lines reference, and the ticket with its lines in the entry status,
 * then the inbox message it is made from is attached to it (ADR 0085), all in one transaction.
 * A template makes the first status change `TEMPLATE`; its own lines and fields are not applied.
 */
export async function runTicketCreate({
  context,
  input,
}: CreateTicketInput): Promise<Result<TicketDto>> {
  const access = checkIntakeAccess({ context, input });
  if (!access.ok) return access;
  const found = await earlier({ context, input });
  if (!found.ok) return found;
  if (found.value) return ok({ value: found.value });
  const lines = input.lines ?? [];
  for (const check of [
    await checkTemplate({ context, templateId: input.templateId }),
    await checkCreateLines({ context, lines, customerId: input.customerId }),
  ]) {
    if (!check.ok) return check;
  }
  const trigger = input.templateId ? "TEMPLATE" : "MANUAL";
  const made = await createWithLines({ context, input, lines, trigger, subject: "the ticket" });
  if (!made.ok || !input.inboundMessageId) return made;
  const ticketId = made.value.id;
  const id = input.inboundMessageId;
  const attached = await attachMessage({ context, id, ticketId, path: "inboundMessageId" });
  return attached.ok ? made : attached;
}
