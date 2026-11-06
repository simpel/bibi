import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { OperationContext } from "../../operations/types";
import { createItem } from "../item/write-operations";
import type { CreateDraftLine } from "../order/draft-line-schema";
import type { ExampleLine } from "./examples-schema";

type ItemInput = { context: OperationContext; line: ExampleLine };

/** The line's item: found by name in its item type, or created there; null without the type. */
async function exampleItem({ context, line }: ItemInput): Promise<Result<string | null>> {
  const type = await context.db.entityType.findFirst({
    where: { base: "ITEM", name: line.itemType },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!type) return ok({ value: null });
  const found = await context.db.item.findFirst({
    where: { entityTypeId: type.id, name: line.itemName },
    select: { id: true },
  });
  if (found) return ok({ value: found.id });
  const input = { entityTypeId: type.id, name: line.itemName };
  const created = await runNested({ operation: createItem, input, context });
  return created.ok ? ok({ value: created.value.id }) : created;
}

export type ExampleLinesInput = {
  context: OperationContext;
  lines: readonly ExampleLine[];
  lineTypeId: string;
  startsAt: Date;
  endsAt: Date;
};

/** The order's draft lines over its whole span; a line whose item type is missing is skipped. */
export async function exampleLines({
  context,
  lines,
  lineTypeId,
  startsAt,
  endsAt,
}: ExampleLinesInput): Promise<Result<CreateDraftLine[]>> {
  const drafts: CreateDraftLine[] = [];
  for (const line of lines) {
    const itemId = await exampleItem({ context, line });
    if (!itemId.ok) return itemId;
    if (!itemId.value) continue;
    drafts.push({
      entityTypeId: lineTypeId,
      name: line.name,
      itemId: itemId.value,
      startsAt,
      endsAt,
      ...(line.quantity === undefined ? {} : { quantity: line.quantity }),
      ...(line.unitPriceMinor === undefined ? {} : { unitPriceMinor: line.unitPriceMinor }),
    });
  }
  return ok({ value: drafts });
}
