import { ok, type Result } from "../../errors/result";
import { createTicketTemplate } from "../../features/ticket-template/operations";
import type { TicketTemplateLineInput } from "../../features/ticket-template/schema";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoRefs } from "./demo-refs";
import { missing } from "./seed-fields";
import type { DemoTemplateLine, DemoTicketTemplate } from "./template-types";

export type SeedTemplatesInput = {
  context: ExecuteContext;
  templates: readonly DemoTicketTemplate[];
  refs: DemoRefs;
};

type LineInput = {
  context: ExecuteContext;
  line: DemoTemplateLine;
  typeId: string;
  refs: DemoRefs;
};

/** One template line as `ticketTemplate.create` takes it: item and setup by name → ids. */
async function toLineInput({ context, line, typeId, refs }: LineInput) {
  const item = await context.db.item.findFirst({ where: { name: line.item } });
  if (!item) return missing({ what: `item ${line.item}` });
  const setupId = line.setup ? refs.setups.get(line.setup) : undefined;
  if (line.setup && !setupId) return missing({ what: `setup ${line.setup}` });
  const input: TicketTemplateLineInput = {
    ...{ entityTypeId: typeId, name: line.name, itemId: item.id, setupId: setupId ?? null },
    ...{ offsetMinutes: line.offsetMinutes, durationMinutes: line.durationMinutes },
    quantity: line.quantity ?? null,
    quantityBasis: line.perHeadcount ? "PER_HEADCOUNT" : "FIXED",
  };
  return ok({ value: input });
}

type TemplateInput = Omit<SeedTemplatesInput, "templates"> & { template: DemoTicketTemplate };

async function seedTemplate({ context, refs, template }: TemplateInput): Promise<Result<true>> {
  const type = refs.ticketTypes.get(template.type);
  if (!type) return missing({ what: `ticket type ${template.type}` });
  const phase = await context.db.ticketPhase.findFirst({ where: { name: template.phase } });
  if (!phase) return missing({ what: `ticket phase ${template.phase}` });
  const lineType = await context.db.entityType.findFirst({ where: { base: "PROGRAM_ITEM" } });
  if (!lineType) return missing({ what: "a line type (base PROGRAM_ITEM)" });
  const lines: TicketTemplateLineInput[] = [];
  for (const line of template.lines) {
    const input = await toLineInput({ context, line, typeId: lineType.id, refs });
    if (!input.ok) return input;
    lines.push(input.value);
  }
  const input = { name: template.name, entityTypeId: type.id, phaseId: phase.id, lines };
  const created = await execute({ operation: createTicketTemplate, input, context });
  return created.ok ? ok({ value: true }) : created;
}

/**
 * The organization's predefined tickets (ADR 0043, 0025) through `ticketTemplate.create` as
 * SYSTEM, after the pipeline (their start phases) and before the tickets that use them.
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
