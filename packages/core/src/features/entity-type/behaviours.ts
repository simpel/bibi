import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { BEHAVIOUR_REQUIRES, type EntityBase, type ItemBehaviour } from "./behaviour-kinds";

export type CheckBehavioursInput = { base: EntityBase; behaviours: readonly ItemBehaviour[] };

/** Only item types have behaviours, and CHOICES/SETUPS need COMPOSABLE/BOOKABLE. */
export function checkBehaviours({ base, behaviours }: CheckBehavioursInput): Result<true> {
  if (base !== "ITEM" && behaviours.length > 0) {
    const message = "Only item types have behaviours";
    return invalid({ message, issues: [{ path: "behaviours", message }] });
  }
  for (const behaviour of behaviours) {
    const required = BEHAVIOUR_REQUIRES[behaviour];
    if (required && !behaviours.includes(required)) {
      const message = `${behaviour} requires ${required}`;
      return invalid({ message, issues: [{ path: "behaviours", message }] });
    }
  }
  return ok({ value: true });
}

type Db = Pick<OperationContext, "db">;
type CountInput = { context: Db; entityTypeId: string };

/** Active items of the type that carry data for each behaviour. */
const DATA_COUNTS: Record<ItemBehaviour, (input: CountInput) => Promise<number>> = {
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
  COMPOSABLE: ({ context, entityTypeId }) =>
    context.db.itemComponent.count({ where: { parent: { entityTypeId, status: "ACTIVE" } } }),
  // Choice groups arrive later; until then there is no data.
  CHOICES: async () => 0,
};

export type CheckRemovableInput = CountInput & { removed: readonly ItemBehaviour[] };

/** A behaviour cannot be switched off while items of the type have data for it (ADR 0021). */
export async function checkBehavioursRemovable({
  context,
  entityTypeId,
  removed,
}: CheckRemovableInput): Promise<Result<true>> {
  for (const behaviour of removed) {
    const count = await DATA_COUNTS[behaviour]({ context, entityTypeId });
    if (count > 0) return conflict({ message: `${count} items have ${behaviour} data` });
  }
  return ok({ value: true });
}
