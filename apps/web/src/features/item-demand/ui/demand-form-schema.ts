import type { ItemDemandDto, ItemDemandUpdateInput } from "@bibi/core";
import { type DemandWindow, ItemDemandCreateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the demand form; the needing item is fixed by the page. */
export type DemandFormValues = {
  entityTypeId: string;
  required: boolean;
  quantity: string;
  windows: DemandWindow[];
};

export type DemandFormOutput = z.infer<typeof ItemDemandCreateInputSchema>;

export type DemandDefaultsInput = { demand?: ItemDemandDto | undefined };

export const demandFormDefaults = ({ demand }: DemandDefaultsInput) =>
  ({
    entityTypeId: demand?.entityTypeId ?? "",
    required: demand?.required ?? true,
    quantity: String(demand?.quantity ?? 1),
    windows: demand?.windows ?? ["BOOKING"],
  }) satisfies DemandFormValues;

export type DemandSchemaInput = { itemId: string; demand?: ItemDemandDto | undefined };

/**
 * Core's create schema is the single source of validation rules. When editing, the target is
 * the demand's own (it cannot change), so the schema still sees a valid one.
 */
export const demandFormSchema = ({ itemId, demand }: DemandSchemaInput) =>
  formSchema({
    schema: ItemDemandCreateInputSchema,
    toInput: ({ values }: { values: DemandFormValues }) => ({
      itemId,
      ...(demand?.targetItemId
        ? { targetItemId: demand.targetItemId }
        : { entityTypeId: values.entityTypeId }),
      required: values.required,
      quantity: values.quantity.trim() === "" ? Number.NaN : Number(values.quantity),
      windows: values.windows,
    }),
  });

export type DemandUpdateArgs = { demand: ItemDemandDto; values: DemandFormOutput };

/** Create-shaped values → `itemDemand.update` input (the target cannot change). */
export const toDemandUpdate = ({ demand, values }: DemandUpdateArgs): ItemDemandUpdateInput => ({
  id: demand.id,
  required: values.required,
  quantity: values.quantity,
  windows: values.windows,
});
