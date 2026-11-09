import { getSetupLayout } from "../../features/floor-plan/layout-operations";
import { listItems } from "../../features/item/read-operations";
import { listSetups } from "../../features/setup/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckFloorPlansInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0099: every drawn layout has no warnings, and a layout that uses its seats has the seat
 * count as its effective capacity. Returns failure messages.
 */
export async function checkDemoFloorPlans({
  context,
  org,
}: CheckFloorPlansInput): Promise<string[]> {
  const plans = org.config.floorPlans ?? [];
  if (plans.length === 0) return [];
  const [items, setups] = await Promise.all([
    execute({ operation: listItems, input: { capability: "SETUPS", limit: 100 }, context }),
    execute({ operation: listSetups, input: { limit: 100 }, context }),
  ]);
  if (!items.ok || !setups.ok) return [`${org.slug}: could not read items or setups`];
  const failures: string[] = [];
  for (const plan of plans) {
    const itemId = items.value.items.find((item) => item.name === plan.item)?.id;
    for (const [name, drawn] of Object.entries(plan.layouts)) {
      const setupId = setups.value.items.find((setup) => setup.name === name)?.id;
      if (!itemId || !setupId) {
        failures.push(`${org.slug}: ${plan.item} ${name} is missing`);
        continue;
      }
      const layout = await execute({
        operation: getSetupLayout,
        input: { itemId, setupId },
        context,
      });
      if (!layout.ok) {
        failures.push(`${org.slug}: could not read the ${name} layout of ${plan.item}`);
        continue;
      }
      const { issues, seatCount, effectiveCapacity, capacitySource } = layout.value;
      if (issues.length > 0) {
        failures.push(`${org.slug}: ${plan.item} ${name} has ${issues.length} warnings`);
      }
      if (drawn.useSeats && (capacitySource !== "LAYOUT" || effectiveCapacity !== seatCount)) {
        failures.push(
          `${org.slug}: ${plan.item} ${name} does not take its capacity from the seats`,
        );
      }
    }
  }
  return failures;
}
