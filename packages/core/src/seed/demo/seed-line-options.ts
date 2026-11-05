import { ok, type Result } from "../../errors/result";
import { chooseLineOptions } from "../../features/line/operations";
import { updateLine } from "../../features/line/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoLineOption } from "./order-types";
import { missing } from "./seed-fields";

export type SeedLineOptionsInput = {
  context: ExecuteContext;
  lineId: string;
  options: readonly DemoLineOption[] | undefined;
};

/**
 * The line's chosen options through `line.chooseOptions` (ADR 0059, 0082), as a person would
 * pick them: by item name, with a quantity per option of a split group.
 */
export async function seedLineOptions({
  context,
  lineId,
  options,
}: SeedLineOptionsInput): Promise<Result<true>> {
  if (!options || options.length === 0) return ok({ value: true });
  const chosen = [];
  for (const option of options) {
    const item = await context.db.item.findFirst({
      where: { name: option.name, customerId: null },
      select: { id: true },
    });
    if (!item) return missing({ what: `option ${option.name}` });
    chosen.push({ itemId: item.id, ...(option.quantity ? { quantity: option.quantity } : {}) });
  }
  const input = { lineId, options: chosen };
  const result = await execute({ operation: chooseLineOptions, input, context });
  if (!result.ok) return result;
  return pricedOptions({ context, lines: result.value.items, options });
}

type PricedInput = {
  context: ExecuteContext;
  lines: readonly { id: string; name: string }[];
  options: readonly DemoLineOption[];
};

/** The option lines' own prices (`line.update`), for options the data gives one. */
async function pricedOptions({ context, lines, options }: PricedInput): Promise<Result<true>> {
  for (const option of options.filter((each) => each.unitPriceKr !== undefined)) {
    const line = lines.find((each) => each.name === option.name);
    if (!line) return missing({ what: `option line ${option.name}` });
    const input = { id: line.id, unitPriceMinor: (option.unitPriceKr ?? 0) * 100 };
    const updated = await execute({ operation: updateLine, input, context });
    if (!updated.ok) return updated;
  }
  return ok({ value: true });
}
