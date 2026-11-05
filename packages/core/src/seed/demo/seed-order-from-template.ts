import { createOrderFromTemplate } from "../../features/order/create-from-template-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { missing } from "./seed-fields";

export type DemoOrderFromTemplateInput = {
  context: ExecuteContext;
  /** The predefined order's name. */
  template: string;
  customerId: string;
  contactId: string;
  startsAt: Date;
  headcount: number;
  assigneeId: string | null;
  title: string;
};

/**
 * An order from its predefined order through `order.createFromTemplate` (ADR 0043): it starts in
 * the template's status with the template's lines, in the states the status grid gives them.
 */
export async function createDemoOrderFromTemplate({
  context,
  template,
  headcount,
  ...rest
}: DemoOrderFromTemplateInput) {
  const found = await context.db.orderTemplate.findFirst({ where: { name: template } });
  if (!found) return missing({ what: `order template ${template}` });
  const input = { templateId: found.id, headcount, ...rest };
  return execute({ operation: createOrderFromTemplate, input, context });
}
