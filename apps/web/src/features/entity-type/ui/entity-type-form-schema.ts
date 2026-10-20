import type { EntityTypeDto } from "@okazi/core";
import {
  type EntityBase,
  EntityTypeCreateInputSchema,
  type ItemCapability,
} from "@okazi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the type form. Capabilities only apply to ITEM types. */
export type EntityTypeFormValues = {
  base: EntityBase;
  name: string;
  capabilities: ItemCapability[];
};

/** What the resolver outputs: core's create input. */
export type EntityTypeFormOutput = z.infer<typeof EntityTypeCreateInputSchema>;

export type EntityTypeFormInput = { values: EntityTypeFormValues };

/** Form values → the shape core's `entityType.create` input schema validates. */
export function entityTypeFormToInput({ values }: EntityTypeFormInput) {
  return {
    base: values.base,
    name: values.name.trim(),
    capabilities: values.base === "ITEM" ? values.capabilities : undefined,
  };
}

export const entityTypeFormSchema = formSchema({
  schema: EntityTypeCreateInputSchema,
  toInput: entityTypeFormToInput,
});

export type EntityTypeDefaultsInput = { entityType?: EntityTypeDto | undefined };

export function entityTypeFormDefaults({
  entityType,
}: EntityTypeDefaultsInput): EntityTypeFormValues {
  return {
    base: entityType?.base ?? "ITEM",
    name: entityType?.name ?? "",
    capabilities: entityType?.capabilities ?? [],
  };
}
