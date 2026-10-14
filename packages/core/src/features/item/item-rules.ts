import type { EntityType } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { ItemBehaviour } from "../entity-type/behaviour-kinds";

type Db = Pick<OperationContext, "db">;

const issue = ({ path, message }: { path: string; message: string }) =>
  invalid({ message, issues: [{ path, message }] });

export type LoadItemTypeInput = { context: Db; entityTypeId: string };

/** The active item type an item is created with. */
export async function loadItemType({
  context,
  entityTypeId,
}: LoadItemTypeInput): Promise<Result<EntityType>> {
  const type = await context.db.entityType.findFirst({ where: { id: entityTypeId, base: "ITEM" } });
  return type ? ok({ value: type }) : issue({ path: "entityTypeId", message: "Unknown item type" });
}

/** Which input keys carry data for which behaviour. */
const BEHAVIOUR_KEYS: Record<string, ItemBehaviour> = {
  priceMinor: "PRICED",
  priceUnit: "PRICED",
  vatRatePercent: "PRICED",
  defaultDurationMinutes: "BOOKABLE",
  setups: "SETUPS",
};

export type CheckBehaviourDataInput = {
  behaviours: readonly ItemBehaviour[];
  data: Record<string, unknown>;
};

/** Behaviour data is only accepted when the item's type has the behaviour (ADR 0021). */
export function checkBehaviourData({ behaviours, data }: CheckBehaviourDataInput): Result<true> {
  for (const [key, behaviour] of Object.entries(BEHAVIOUR_KEYS)) {
    const value = data[key];
    const empty = value === undefined || value === null || (Array.isArray(value) && !value.length);
    if (!empty && !behaviours.includes(behaviour)) {
      return issue({ path: key, message: `The item type does not have ${behaviour}` });
    }
  }
  return ok({ value: true });
}

export type CheckVenueInput = { context: Db; venueId: string | null | undefined };

export async function checkVenue({ context, venueId }: CheckVenueInput): Promise<Result<true>> {
  if (!venueId || (await context.db.venue.findFirst({ where: { id: venueId } }))) {
    return ok({ value: true });
  }
  return issue({ path: "venueId", message: "Unknown venue" });
}
