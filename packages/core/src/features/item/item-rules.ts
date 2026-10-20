import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { ItemCapability } from "../entity-type/capability-kinds";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";

type Db = Pick<OperationContext, "db">;

const issue = ({ path, message }: { path: string; message: string }) =>
  invalid({ message, issues: [{ path, message }] });

export type LoadItemTypeInput = { context: Db; entityTypeId: string };

/** The active item type an item is created with. */
export const loadItemType = ({ context, entityTypeId }: LoadItemTypeInput) =>
  loadTypeOfBase({ context, entityTypeId, base: "ITEM" });

/** Which input keys carry data for which capability. */
const CAPABILITY_KEYS: Record<string, ItemCapability> = {
  priceMinor: "PRICED",
  priceUnit: "PRICED",
  vatRatePercent: "PRICED",
  defaultDurationMinutes: "BOOKABLE",
  setups: "SETUPS",
  parts: "BUNDLE",
  customisationGroups: "CUSTOMISATIONS",
};

export type CheckCapabilityDataInput = {
  capabilities: readonly ItemCapability[];
  data: Record<string, unknown>;
};

/** Capability data is only accepted when the item's type has the capability (ADR 0021). */
export function checkCapabilityData({
  capabilities,
  data,
}: CheckCapabilityDataInput): Result<true> {
  for (const [key, capability] of Object.entries(CAPABILITY_KEYS)) {
    const value = data[key];
    const empty = value === undefined || value === null || (Array.isArray(value) && !value.length);
    if (!empty && !capabilities.includes(capability)) {
      return issue({ path: key, message: `The item type does not have ${capability}` });
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
