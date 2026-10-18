import { createTicketFromTemplate } from "../../features/ticket/create-from-template-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";

export type DemoTicketFromTemplateInput = {
  context: ExecuteContext;
  /** The predefined ticket's name. */
  template: string;
  customerId: string;
  startsAt: Date;
  headcount: number;
  assigneeId: string | null;
};

/**
 * A ticket from its predefined ticket through `ticket.createFromTemplate` (ADR 0043): it starts in
 * the template's phase with the template's lines, in the states the phase grid gives them.
 */
export async function createDemoTicketFromTemplate({
  context,
  template,
  headcount,
  ...rest
}: DemoTicketFromTemplateInput) {
  const found = await context.db.ticketTemplate.findFirst({ where: { name: template } });
  if (!found) return missing({ what: `ticket template ${template}` });
  const input = { templateId: found.id, quantity: headcount, ...rest };
  return execute({ operation: createTicketFromTemplate, input, context });
}
