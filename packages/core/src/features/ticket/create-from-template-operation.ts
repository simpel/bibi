import { ok, type Result } from "../../errors/result";
import { allFollowUps } from "../../operations/all-follow-ups";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { notifyCreatedAssignee } from "../notification/follow-ups";
import { freshDefaults } from "../ticket-template/line-defaults";
import { loadTicketTemplate } from "../ticket-template/load-ticket-template";
import type { TicketTemplateDto } from "../ticket-template/schema";
import { regenerateForTicket } from "../work-order/regenerate";
import type { TicketCreateFromTemplateInput } from "./create-from-template-schema";
import { TicketCreateFromTemplateInputSchema } from "./create-from-template-schema";
import { createWithLines } from "./create-with-lines";
import { planTemplateLines } from "./plan/plan-template-lines";
import { type TicketDto, TicketSchema } from "./schema";
import { checkReadable } from "./ticket-rules";
import { titleAfterCreate } from "./title/generate-title";

type CreateInput = {
  context: OperationContext;
  template: TicketTemplateDto;
  input: TicketCreateFromTemplateInput;
};

/** The start status must still take new tickets: active and not closing. */
async function checkStartStatus({ context, template }: Omit<CreateInput, "input">) {
  const ticketStatus = await context.db.ticketStatus.findFirst({
    where: { id: template.statusId },
  });
  if (ticketStatus && !ticketStatus.closes) return ok({ value: true as const });
  const message = `The template's status is gone or closing: change the template "${template.name}"`;
  return conflict({ message, issues: [{ path: "templateId", message }] });
}

/** The template's lines planned from the start, through the one path `ticket.create` uses. */
async function create({ context, template, input }: CreateInput): Promise<Result<TicketDto>> {
  const { startsAt, headcount, customerId, contactId, assigneeId, title } = input;
  const plan = planTemplateLines({ template, startsAt });
  const statusd = await checkStartStatus({ context, template });
  if (!statusd.ok) return statusd;
  return createWithLines({
    context,
    statusId: template.statusId,
    trigger: "TEMPLATE",
    subject: `a ticket from "${template.name}"`,
    // The package's default choices that still fit (ADR 0089).
    lines: plan.lines.map((line, index) => ({
      ...line,
      options: freshDefaults({ options: template.lines[index]?.options ?? [] }),
    })),
    input: {
      ...{ entityTypeId: template.entityTypeId, customerId, contactId, assigneeId, title },
      fields: template.fields,
      estimatedHeadcount: headcount,
      ...{ desiredStartsAt: startsAt, desiredEndsAt: plan.endsAt },
    },
  });
}

export const createTicketFromTemplate = defineOperation({
  name: "ticket.createFromTemplate",
  kind: "command",
  description:
    "Create a ticket from one of the organization's predefined tickets in one step (ADR 0043): " +
    "the template's ticket type, default fields and start status, for a customer and one of its " +
    "contacts (required, ADR 0081), starting at " +
    "`startsAt` with `headcount` as the estimated headcount. Its lines are created timed from " +
    "the start (a line without a quantity counts the headcount) with the package's default " +
    "choices that still fit its item (ADR 0089; an open required group is the line warning " +
    "UNCHOSEN_REQUIRED_GROUP), " +
    "in the states the status grid gives for the start status. If any line's hard hold would " +
    "collide, nothing is created and CONFLICT lists every blocking line in `issues`. Without a " +
    "`title` one is generated from the ticket after it is created (null when none could be).",
  input: TicketCreateFromTemplateInputSchema,
  output: TicketSchema,
  permission: "ticket:write",
  followUp: allFollowUps({ steps: [regenerateForTicket, notifyCreatedAssignee] }),
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
  external: titleAfterCreate,
  externalOptional: true,
});
