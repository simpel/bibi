import type { EntityTypeDto } from "@okazi/core";
import type { ItemBehaviour } from "@okazi/core/schemas";
import type { FieldPath } from "react-hook-form";
import { hasBehaviour } from "./has-behaviour";
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
    "setups",
    "components",
    "choiceGroups",
  ],
};

const BEHAVIOURS: ItemBehaviour[] = ["PRICED", "BOOKABLE", "SETUPS", "COMPOSABLE", "CHOICES"];

export type StepsForInput = { type: EntityTypeDto | undefined };

/** The setup step exists only when the type has a behaviour that needs it. */
export function stepsFor({ type }: StepsForInput): WizardStep[] {
  const needsSetup = BEHAVIOURS.some((behaviour) => hasBehaviour({ type, behaviour }));
  return needsSetup ? ["type", "details", "setup"] : ["type", "details"];
}
