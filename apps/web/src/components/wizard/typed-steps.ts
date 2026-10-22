import type { EntityTypeDto } from "@bibi/core";
import type { FieldPath, FieldValues } from "react-hook-form";

export type TypedStep = "type" | "details" | "fields";

export type TypedStepsInput = { type: EntityTypeDto | undefined };

/** Type, the record's own details, then the type's own fields (only when the type has any). */
export function typedStepsFor({ type }: TypedStepsInput): TypedStep[] {
  return type && type.fields.length > 0 ? ["type", "details", "fields"] : ["type", "details"];
}

export type TypedStepFieldsInput<V extends FieldValues> = {
  step: TypedStep;
  /** The form names the "details" step edits. */
  coreFields: FieldPath<V>[];
};

/** The form fields a step shows: Next validates them, a failed save jumps to the first with an error. */
export function typedStepFields<V extends FieldValues>({
  step,
  coreFields,
}: TypedStepFieldsInput<V>): FieldPath<V>[] {
  if (step === "details") return coreFields;
  return [step === "type" ? "entityTypeId" : "fields"] as FieldPath<V>[];
}
