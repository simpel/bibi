import type { EntityTypeDto, VocabularyDto } from "@okazi/core";
import { buildFieldsSchema, type FieldSpec, ItemCreateInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsToInput } from "@/components/typed-fields/raw-fields";
import { blankToNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { hasBehaviour } from "./has-behaviour";
import { type ComponentFormValue, type ItemFormValues, NO_VENUE } from "./item-form-values";

/** What the resolver outputs: core's create input. */
export type ItemFormOutput = z.infer<typeof ItemCreateInputSchema>;

export type ItemInputArgs = {
  values: ItemFormValues;
  type: EntityTypeDto | undefined;
  specs: FieldSpec[];
};

type ComponentsInput = { components: ComponentFormValue[] };

/** Raw part rows → core's `components`; rows without a part are left out. */
function componentsToInput({ components }: ComponentsInput) {
  return components
    .filter((component) => component.itemId !== "")
    .map((component) => ({
      itemId: component.itemId,
      quantity: numberOrNull({ value: component.quantity }) ?? 1,
      offsetMinutes: numberOrNull({ value: component.offsetMinutes }) ?? 0,
      durationMinutes: numberOrNull({ value: component.durationMinutes }),
      required: component.required,
    }));
}

/** Fields of the behaviours the type has; sections of other behaviours are left out. */
function behaviourInput({ values, type }: Omit<ItemInputArgs, "specs">) {
  const kr = numberOrNull({ value: values.price });
  return {
    ...(hasBehaviour({ type, behaviour: "PRICED" })
      ? {
          priceMinor: kr === null ? null : Math.round(kr * 100),
          priceUnit: kr === null ? null : values.priceUnit,
          vatRatePercent: numberOrNull({ value: values.vatRatePercent }),
        }
      : {}),
    ...(hasBehaviour({ type, behaviour: "BOOKABLE" })
      ? { defaultDurationMinutes: numberOrNull({ value: values.defaultDurationMinutes }) }
      : {}),
    ...(hasBehaviour({ type, behaviour: "SETUPS" })
      ? {
          setups: Object.entries(values.setups)
            .filter(([, capacity]) => capacity.trim() !== "")
            .map(([setupId, capacity]) => ({ setupId, capacity: Number(capacity) })),
        }
      : {}),
    ...(hasBehaviour({ type, behaviour: "COMPOSABLE" })
      ? { components: componentsToInput({ components: values.components }) }
      : {}),
  };
}

/** Form values → the shape core's `item.create` input schema validates. */
export function itemFormToInput({ values, type, specs }: ItemInputArgs) {
  return {
    entityTypeId: values.entityTypeId,
    venueId: values.venueId === NO_VENUE ? null : values.venueId,
    name: values.name.trim(),
    description: blankToNull({ value: values.description }),
    fields: fieldsToInput({ values, specs }),
    ...behaviourInput({ values, type }),
  };
}

export type ItemSchemaInput = { type: EntityTypeDto | undefined; vocabularies: VocabularyDto[] };

/**
 * Core's item schema with `fields` checked against the type's own field definitions
 * (`buildFieldsSchema`); built per type because the fields differ. The server validates again.
 */
export function itemFormSchema({ type, vocabularies }: ItemSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  return formSchema({
    schema: ItemCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: ItemFormValues }) => itemFormToInput({ values, type, specs }),
  });
}
