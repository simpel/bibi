import type { EntityTypeDto } from "@bibi/core";
import {
  type EntityBase,
  EntityTypeCreateInputSchema,
  type ItemCapability,
  type ResourceKind,
} from "@bibi/core/schemas";
import type { z } from "zod";
import {
  type BufferFormValues,
  bufferFormDefaults,
  bufferFormToInput,
} from "@/components/form/buffer-values";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the type form. Capabilities, buffers and resource kind only apply to ITEM types. */
export type EntityTypeFormValues = BufferFormValues & {
  base: EntityBase;
  name: string;
  capabilities: ItemCapability[];
  /** Item types: Equipment or Person (ADR 0059). */
  resourceKind: ResourceKind;
};

/** What the resolver outputs: core's create input. */
export type EntityTypeFormOutput = z.infer<typeof EntityTypeCreateInputSchema>;

export type EntityTypeFormInput = { values: EntityTypeFormValues };

/** Form values → the shape core's `entityType.create` input schema validates. */
export function entityTypeFormToInput({ values }: EntityTypeFormInput) {
  const item = values.base === "ITEM";
  return {
    base: values.base,
    name: values.name.trim(),
    capabilities: item ? values.capabilities : undefined,
    resourceKind: item ? values.resourceKind : undefined,
    ...(item ? bufferFormToInput({ values }) : {}),
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
    resourceKind: entityType?.resourceKind ?? "EQUIPMENT",
    ...bufferFormDefaults({ stored: entityType }),
  };
}
