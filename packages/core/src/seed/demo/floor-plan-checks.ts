import { getSetupLayout } from "../../features/floor-plan/layout-operations";
import { getFloorPlan } from "../../features/floor-plan/plan-operations";
import { listItems } from "../../features/item/read-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckFloorPlansInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0099, 0102: every drawn layout exists by name and has no warnings, and a setup that uses
 * its seats has its largest layout's seat count as its effective capacity. Returns failures.
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
        ? await execute({ operation: getSetupLayout, input: { id: summary.id }, context })
        : null;
      if (!layout?.ok) {
        failures.push(`${org.slug}: ${plan.item} has no layout ${drawn.name}`);
        continue;
      }
      const { issues, effectiveCapacity, capacitySource, setupId } = layout.value;
      if (issues.length > 0) {
        failures.push(`${org.slug}: ${plan.item} ${drawn.name} has ${issues.length} warnings`);
      }
      const largest = Math.max(
        ...read.value.layouts
          .filter((each) => each.setupId === setupId)
          .map((each) => each.seatCount),
      );
      if (drawn.useSeats && (capacitySource !== "LAYOUT" || effectiveCapacity !== largest)) {
        failures.push(
          `${org.slug}: ${plan.item} ${drawn.name} does not take its capacity from the seats`,
        );
      }
    }
  }
  return failures;
}
