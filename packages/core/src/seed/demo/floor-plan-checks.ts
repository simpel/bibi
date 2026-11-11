import { getLayout } from "../../features/floor-plan/layout-operations";
import { getFloorPlan } from "../../features/floor-plan/plan-operations";
import { listItems } from "../../features/item/read-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckFloorPlansInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0099, 0102, 0103: every drawn layout exists by name and has no problems, and one that uses
 * its seats has its seat count as its capacity. Returns failure messages.
 */
export async function checkDemoFloorPlans({
  context,
  org,
}: CheckFloorPlansInput): Promise<string[]> {
  const plans = org.config.floorPlans ?? [];
  if (plans.length === 0) return [];
  const items = await execute({
    operation: listItems,
    input: { capability: "SETUPS", limit: 100 },
    context,
  });
  if (!items.ok) return [`${org.slug}: could not read items`];
  const failures: string[] = [];
  for (const plan of plans) {
    const itemId = items.value.items.find((item) => item.name === plan.item)?.id;
    const read = itemId
      ? await execute({ operation: getFloorPlan, input: { itemId }, context })
      : null;
    if (!read?.ok) {
      failures.push(`${org.slug}: could not read the floor plan of ${plan.item}`);
      continue;
    }
    for (const drawn of plan.layouts) {
      const summary = read.value.layouts.find((layout) => layout.name === drawn.name);
      const layout = summary
        ? await execute({ operation: getLayout, input: { id: summary.id }, context })
        : null;
      if (!layout?.ok) {
        failures.push(`${org.slug}: ${plan.item} has no layout ${drawn.name}`);
        continue;
      }
      const { issues, effectiveCapacity, capacitySource, seatCount } = layout.value;
      if (issues.length > 0) {
        failures.push(`${org.slug}: ${plan.item} ${drawn.name} has ${issues.length} problems`);
      }
      if (drawn.useSeats && (capacitySource !== "LAYOUT" || effectiveCapacity !== seatCount)) {
        failures.push(
          `${org.slug}: ${plan.item} ${drawn.name} does not take its capacity from the seats`,
        );
      }
    }
  }
  return failures;
}
