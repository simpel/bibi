import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid, notFound } from "../../shared/errors";
import { insertProgramItem } from "../program-item/insert-program-item";
import { loadTicketTemplate } from "../ticket-template/load-ticket-template";
import type { TicketTemplateDto } from "../ticket-template/schema";
import type { TicketCreateFromTemplateInput } from "./create-from-template-schema";
import { TicketCreateFromTemplateInputSchema } from "./create-from-template-schema";
import { insertTicket } from "./insert-ticket";
import { planTemplateLines } from "./plan-template-lines";
import { type TicketDto, TicketSchema } from "./schema";
import { templateCollisions } from "./template-collisions";
import { checkReadable } from "./ticket-rules";

type CreateInput = {
  context: OperationContext;
  template: TicketTemplateDto;
  input: TicketCreateFromTemplateInput;
};

/** The start phase must still take new tickets: active and not terminal. */
async function checkStartPhase({ context, template }: Omit<CreateInput, "input">) {
  const phase = await context.db.ticketPhase.findFirst({ where: { id: template.phaseId } });
  if (phase && !phase.terminal) return ok({ value: true as const });
  const message = `The template's phase is gone or terminal: change the template "${template.name}"`;
  return conflict({ message, issues: [{ path: "templateId", message }] });
}

async function create({ context, template, input }: CreateInput): Promise<Result<TicketDto>> {
  const { startsAt, quantity, customerId, assigneeId } = input;
  const plan = planTemplateLines({ template, startsAt, quantity });
  if (plan.issues.length > 0)
    return invalid({ message: "A line quantity is too large", issues: plan.issues });
  const phased = await checkStartPhase({ context, template });
  if (!phased.ok) return phased;
  const blockers = await templateCollisions({
    context,
    phaseId: template.phaseId,
    lines: plan.lines,
  });
  if (blockers.length > 0) {
    const message = `Cannot create a ticket from "${template.name}": ${blockers.length} line(s) are blocked`;
    return conflict({ message, issues: blockers });
  }
  const ticket = await insertTicket({
    context,
    phaseId: template.phaseId,
    input: {
      ...{ entityTypeId: template.entityTypeId, customerId, assigneeId, fields: template.fields },
      ...{ quantity, estimatedHeadcount: quantity },
      ...{ desiredStartsAt: startsAt, desiredEndsAt: plan.endsAt },
    },
  });
  if (!ticket.ok) return ticket;
  for (const line of plan.lines) {
    const made = await insertProgramItem({
      context,
      input: { ...line, ticketId: ticket.value.id },
    });
    if (!made.ok) return made;
  }
  return ticket;
}

export const createTicketFromTemplate = defineOperation({
  name: "ticket.createFromTemplate",
  kind: "command",
  description:
    "Create a ticket from one of the organization's predefined tickets in one step (ADR 0043): " +
    "the template's ticket type, default fields and start phase, for a customer, starting at " +
    "`startsAt` with `quantity` as the headcount. Its lines are created timed from the start, " +
    "in the states the phase grid gives for the start phase. If any line's hard hold would " +
    "collide, nothing is created and CONFLICT lists every blocking line in `issues`.",
  input: TicketCreateFromTemplateInputSchema,
  output: TicketSchema,
  permission: "ticket:write",
  handler: async ({ input, context }) => {
    const readable = checkReadable({
      context,
      permission: "template:read",
      path: "templateId",
    });
    if (!readable.ok) return readable;
    const template = await loadTicketTemplate({ context, id: input.templateId });
    if (!template) return notFound({ entity: "Ticket template" });
    return create({ context, template, input });
  },
});
