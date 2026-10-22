import type { EntityTypeDto } from "@bibi/core";
import type { ItemCapability } from "@bibi/core/schemas";
import type { FieldPath } from "react-hook-form";
import { hasCapability } from "./has-capability";
import type { ItemFormValues } from "./item-form-values";

export type WizardStep = "type" | "details" | "setup";

type Fields = FieldPath<ItemFormValues>[];

/** Form fields validated (and shown) on each step. */
export const STEP_FIELDS: Record<WizardStep, Fields> = {
  type: ["entityTypeId"],
  details: ["name", "description", "venueId", "fields"],
  setup: [
    "price",
    "priceUnit",
    "vatRatePercent",
    "defaultDurationMinutes",
    "setupMinutes",
    "teardownMinutes",
    "setups",
    "parts",
    "customisationGroups",
  ],
};

const CAPABILITIES: ItemCapability[] = ["PRICED", "BOOKABLE", "SETUPS", "BUNDLE", "CUSTOMISATIONS"];

export type StepsForInput = { type: EntityTypeDto | undefined };

/** The setup step exists only when the type has a capability that needs it. */
export function stepsFor({ type }: StepsForInput): WizardStep[] {
  const needsSetup = CAPABILITIES.some((capability) => hasCapability({ type, capability }));
  return needsSetup ? ["type", "details", "setup"] : ["type", "details"];
}
