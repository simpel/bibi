import { ok, type Result } from "../../errors/result";
import { allFollowUps } from "../../operations/all-follow-ups";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { notifyCreatedAssignee } from "../notification/follow-ups";
import { freshDefaults } from "../order-template/line-defaults";
import { loadOrderTemplate } from "../order-template/load-order-template";
import type { OrderTemplateDto } from "../order-template/schema";
import { regenerateForOrder } from "../run-sheet/regenerate";
import type { OrderCreateFromTemplateInput } from "./create-from-template-schema";
import { OrderCreateFromTemplateInputSchema } from "./create-from-template-schema";
import { createWithLines } from "./create-with-lines";
import { checkReadable } from "./order-rules";
import { planTemplateLines } from "./plan/plan-template-lines";
import { type OrderDto, OrderSchema } from "./schema";
import { titleAfterCreate } from "./title/generate-title";

type CreateInput = {
  context: OperationContext;
  template: OrderTemplateDto;
  input: OrderCreateFromTemplateInput;
};

/** The start status must still take new orders: active and not closing. */
async function checkStartStatus({ context, template }: Omit<CreateInput, "input">) {
  const orderStatus = await context.db.orderStatus.findFirst({
    where: { id: template.statusId },
  });
  if (orderStatus && !orderStatus.closes) return ok({ value: true as const });
  const message = `The template's status is gone or closing: change the template "${template.name}"`;
  return conflict({ message, issues: [{ path: "templateId", message }] });
}

/** The template's lines planned from the start, through the one path `order.create` uses. */
async function create({ context, template, input }: CreateInput): Promise<Result<OrderDto>> {
  const { startsAt, headcount, customerId, contactId, assigneeId, title } = input;
  const plan = planTemplateLines({ template, startsAt });
  const statusd = await checkStartStatus({ context, template });
  if (!statusd.ok) return statusd;
  return createWithLines({
    context,
    statusId: template.statusId,
    trigger: "TEMPLATE",
    subject: `an order from "${template.name}"`,
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

export const createOrderFromTemplate = defineOperation({
  name: "order.createFromTemplate",
  kind: "command",
  description:
    "Create an order from one of the organization's predefined orders in one step (ADR 0043): " +
    "the template's order type, default fields and start status, for a customer and one of its " +
    "contacts (required, ADR 0081), starting at " +
    "`startsAt` with `headcount` as the estimated headcount. Its lines are created timed from " +
    "the start (a line without a quantity counts the headcount) with the package's default " +
    "choices that still fit its item (ADR 0089; an open required group is the line warning " +
    "UNCHOSEN_REQUIRED_GROUP), " +
    "in the states the status grid gives for the start status. If any line's hard hold would " +
    "collide, nothing is created and CONFLICT lists every blocking line in `issues`. Without a " +
    "`title` one is generated from the order after it is created (null when none could be).",
  input: OrderCreateFromTemplateInputSchema,
  output: OrderSchema,
  permission: "order:write",
  followUp: allFollowUps({ steps: [regenerateForOrder, notifyCreatedAssignee] }),
  handler: async ({ input, context }) => {
    const readable = checkReadable({
      context,
      permission: "template:read",
      path: "templateId",
    });
    if (!readable.ok) return readable;
    const template = await loadOrderTemplate({ context, id: input.templateId });
    if (!template) return notFound({ entity: "Order template" });
    return create({ context, template, input });
  },
  external: titleAfterCreate,
  externalOptional: true,
});
