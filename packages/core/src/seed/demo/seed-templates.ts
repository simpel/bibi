import { ok, type Result } from "../../errors/result";
import { createOrderTemplate } from "../../features/order-template/operations";
import type { OrderTemplateLineInput } from "../../features/order-template/schema";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoRefs } from "./demo-refs";
import { missing } from "./seed-fields";
import type { DemoOrderTemplate, DemoTemplateLine } from "./template-types";

export type SeedTemplatesInput = {
  context: ExecuteContext;
  templates: readonly DemoOrderTemplate[];
  refs: DemoRefs;
};

type LineInput = {
  context: ExecuteContext;
  line: DemoTemplateLine;
  typeId: string;
};

/** One template line as `orderTemplate.create` takes it: item, layout and defaults by name → ids. */
async function toLineInput({ context, line, typeId }: LineInput) {
  const item = await context.db.item.findFirst({ where: { name: line.item } });
  if (!item) return missing({ what: `item ${line.item}` });
  const options: { itemId: string }[] = [];
  for (const name of line.options ?? []) {
    const option = await context.db.item.findFirst({ where: { name } });
    if (!option) return missing({ what: `option ${name}` });
    options.push({ itemId: option.id });
  }
  const layout = line.layout
    ? await context.db.setupLayout.findFirst({ where: { itemId: item.id, name: line.layout } })
    : null;
  if (line.layout && !layout) return missing({ what: `layout ${line.layout} of ${line.item}` });
  const input: OrderTemplateLineInput = {
    ...{ entityTypeId: typeId, name: line.name, itemId: item.id, layoutId: layout?.id ?? null },
    ...{ offsetMinutes: line.offsetMinutes, durationMinutes: line.durationMinutes },
    quantity: line.quantity ?? null,
    options,
  };
  return ok({ value: input });
}

type TemplateInput = Omit<SeedTemplatesInput, "templates"> & { template: DemoOrderTemplate };

async function seedTemplate({ context, refs, template }: TemplateInput): Promise<Result<true>> {
  const type = refs.orderTypes.get(template.type);
  if (!type) return missing({ what: `order type ${template.type}` });
  const orderStatus = await context.db.orderStatus.findFirst({
    where: { name: template.status },
  });
  if (!orderStatus) return missing({ what: `order status ${template.status}` });
  const lineType = await context.db.entityType.findFirst({ where: { base: "LINE" } });
  if (!lineType) return missing({ what: "a line type (base LINE)" });
  const lines: OrderTemplateLineInput[] = [];
  for (const line of template.lines) {
    const input = await toLineInput({ context, line, typeId: lineType.id });
    if (!input.ok) return input;
    lines.push(input.value);
  }
  const { name, minGuests, maxGuests } = template;
  const input = {
    name,
    minGuests,
    maxGuests,
    entityTypeId: type.id,
    statusId: orderStatus.id,
    lines,
  };
  const created = await execute({ operation: createOrderTemplate, input, context });
  return created.ok ? ok({ value: true }) : created;
}

/**
 * The organization's predefined orders (ADR 0043, 0025) through `orderTemplate.create` as
 * SYSTEM, after the pipeline (their start statuses) and before the orders that use them.
 */
export async function seedDemoTemplates({
  templates,
  ...rest
}: SeedTemplatesInput): Promise<Result<true>> {
  for (const template of templates) {
    const seeded = await seedTemplate({ ...rest, template });
    if (!seeded.ok) return seeded;
  }
  return ok({ value: true });
}
