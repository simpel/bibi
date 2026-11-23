import type { ItemDemandDto } from "@bibi/core";
import type { ResourceKind } from "@bibi/core/schemas";

/** A demand with the name of its target, as the lists show it. */
export type DemandRow = { demand: ItemDemandDto; targetName: string };

/** A pool a demand can target: a bookable item type of one resource kind. */
export type PoolOption = { id: string; name: string };

/** The two labelled lists of the item (ADR 0059, decision 9). */
export type DemandListKind = ResourceKind;

/** Which list's words a demand is shown with: Resources (equipment) or Staffing (people). */
export type DemandList = "resources" | "staffing";

export const listOf = ({ kind }: { kind: DemandListKind }): DemandList =>
  kind === "PERSON" ? "staffing" : "resources";
