import type { OperationContext } from "../../operations/types";
import type { TicketTemplateLineInput } from "./schema";

export type ReplaceLinesInput = {
  context: OperationContext;
  templateId: string;
  lines: readonly TicketTemplateLineInput[];
};

/** Replaces the template's lines as a set, in the given order (audited on the template). */
export async function replaceLines({ context, templateId, lines }: ReplaceLinesInput) {
  await context.db.ticketTemplateLine.deleteMany({ where: { templateId } });
  await context.db.ticketTemplateLine.createMany({
    data: lines.map((line, position) => ({
      ...line,
      itemId: line.itemId ?? null,
      setupId: line.setupId ?? null,
      quantity: line.quantity ?? null,
      position,
      templateId,
      organizationId: context.organizationId,
    })),
  });
}
