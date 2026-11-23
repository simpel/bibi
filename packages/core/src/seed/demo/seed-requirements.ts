import { ok, type Result } from "../../errors/result";
import { createRequirement } from "../../features/requirement/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoRefs } from "./demo-refs";
import type { DemoOrder } from "./order-types";
import { missing, resolveDemoFields } from "./seed-fields";

export type SeedOrderRequirementsInput = {
  context: ExecuteContext;
  refs: DemoRefs;
  order: Pick<DemoOrder, "requirements">;
  orderId: string;
};

/**
 * The order's requirements (ADR 0021) via `requirement.create` as SYSTEM: counts against a list
 * value for the whole order, of the organization's first requirement type.
 */
export async function seedOrderRequirements({
  context,
  refs,
  order,
  orderId,
}: SeedOrderRequirementsInput): Promise<Result<true>> {
  const requirements = order.requirements ?? [];
  if (requirements.length === 0) return ok({ value: true });
  const [type] = refs.requirementTypes.values();
  if (!type) return missing({ what: "requirement type" });
  for (const { list, value, quantity, fields } of requirements) {
    const valueId = refs.lists.get(list)?.values.find(({ name }) => name === value)?.id;
    if (!valueId) return missing({ what: `value ${value} of list ${list}` });
    const resolved = await resolveDemoFields({ context, fields, type });
    if (!resolved.ok) return resolved;
    const input = {
      ...{ orderId, entityTypeId: type.id, vocabularyValueId: valueId, quantity },
      fields: resolved.value,
    };
    const result = await execute({ operation: createRequirement, input, context });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
