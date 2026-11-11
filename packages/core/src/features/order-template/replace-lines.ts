import { createId } from "@paralleldrive/cuid2";
import type { OperationContext } from "../../operations/types";
import type { OrderTemplateLineInput } from "./schema";

export type ReplaceLinesInput = {
  context: OperationContext;
  templateId: string;
  lines: readonly OrderTemplateLineInput[];
};

/**
 * Replaces the template's lines as a set, in the given order, with their default choices (ADR
 * 0089; the old defaults go with their lines). Audited on the template.
 */
export async function replaceLines({ context, templateId, lines }: ReplaceLinesInput) {
  const { organizationId } = context;
  await context.db.orderTemplateLine.deleteMany({ where: { templateId } });
  const rows = lines.map(({ options, ...line }, position) => ({
    line: {
      ...line,
      id: createId(),
      itemId: line.itemId ?? null,
      layoutId: line.layoutId ?? null,
      quantity: line.quantity ?? null,
      ...{ position, templateId, organizationId },
    },
    options: options ?? [],
  }));
  await context.db.orderTemplateLine.createMany({ data: rows.map((row) => row.line) });
  await context.db.orderTemplateLineOption.createMany({
    data: rows.flatMap(({ line, options }) =>
      options.map(({ itemId }, position) => ({
        ...{ templateLineId: line.id, itemId, position, organizationId },
      })),
    ),
  });
}
