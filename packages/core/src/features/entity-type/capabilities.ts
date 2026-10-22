import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { CAPABILITY_REQUIRES, type EntityBase, type ItemCapability } from "./capability-kinds";

export type CheckCapabilitiesInput = { base: EntityBase; capabilities: readonly ItemCapability[] };

/** Only item types have capabilities, and SETUPS needs BOOKABLE (CUSTOMISATIONS stands alone). */
export function checkCapabilities({ base, capabilities }: CheckCapabilitiesInput): Result<true> {
  if (base !== "ITEM" && capabilities.length > 0) {
    const message = "Only item types have capabilities";
    return invalid({ message, issues: [{ path: "capabilities", message }] });
  }
  for (const capability of capabilities) {
    const required = CAPABILITY_REQUIRES[capability];
    if (required && !capabilities.includes(required)) {
      const message = `${capability} requires ${required}`;
      return invalid({ message, issues: [{ path: "capabilities", message }] });
    }
  }
  return ok({ value: true });
}

type Db = Pick<OperationContext, "db">;
type CountInput = { context: Db; entityTypeId: string };

/** Active items of the type that carry data for each capability. */
const DATA_COUNTS: Record<ItemCapability, (input: CountInput) => Promise<number>> = {
  PRICED: ({ context, entityTypeId }) =>
    context.db.item.count({
      where: {
        entityTypeId,
        OR: [
          { priceMinor: { not: null } },
          { priceUnit: { not: null } },
          { vatRatePercent: { not: null } },
        ],
      },
    }),
  BOOKABLE: ({ context, entityTypeId }) =>
    context.db.item.count({ where: { entityTypeId, defaultDurationMinutes: { not: null } } }),
  SETUPS: ({ context, entityTypeId }) =>
    context.db.itemSetup.count({ where: { item: { entityTypeId, status: "ACTIVE" } } }),
  BUNDLE: ({ context, entityTypeId }) =>
    context.db.itemPart.count({ where: { parent: { entityTypeId, status: "ACTIVE" } } }),
  CUSTOMISATIONS: ({ context, entityTypeId }) =>
    context.db.itemCustomisationGroup.count({
      where: { item: { entityTypeId, status: "ACTIVE" } },
    }),
};

export type CheckRemovableInput = CountInput & { removed: readonly ItemCapability[] };

/**
 * A capability cannot be switched off while items of the type have data for it (ADR 0021), nor
 * BOOKABLE while demands use the type as a pool (ADR 0059).
 */
export async function checkCapabilitiesRemovable({
  context,
  entityTypeId,
  removed,
}: CheckRemovableInput): Promise<Result<true>> {
  for (const capability of removed) {
    const count = await DATA_COUNTS[capability]({ context, entityTypeId });
    if (count > 0) return conflict({ message: `${count} items have ${capability} data` });
  }
  // ADR 0059: a pool must stay bookable while demands target it.
  if (removed.includes("BOOKABLE")) {
    const demands = await context.db.itemDemand.count({ where: { entityTypeId } });
    if (demands > 0) return conflict({ message: `${demands} demands use the type as a pool` });
  }
  return ok({ value: true });
}
