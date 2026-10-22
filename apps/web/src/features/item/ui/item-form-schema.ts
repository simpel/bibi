import type { EntityTypeDto, VocabularyDto } from "@bibi/core";
import { buildFieldsSchema, type FieldSpec, ItemCreateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { bufferFormToInput } from "@/components/form/buffer-values";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsToInput } from "@/components/typed-fields/raw-fields";
import { blankToNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { hasCapability } from "./has-capability";
import {
  type CustomisationGroupFormValue,
  type ItemFormValues,
  NO_VENUE,
  type PartFormValue,
} from "./item-form-values";

/** What the resolver outputs: core's create input. */
export type ItemFormOutput = z.infer<typeof ItemCreateInputSchema>;

export type ItemInputArgs = {
  values: ItemFormValues;
  type: EntityTypeDto | undefined;
  specs: FieldSpec[];
};

type PartsInput = { parts: PartFormValue[] };

/** Raw part rows → core's `parts`; rows without a part are left out. */
function partsToInput({ parts }: PartsInput) {
  return parts
    .filter((part) => part.itemId !== "")
    .map((part) => ({
      itemId: part.itemId,
      quantity: numberOrNull({ value: part.quantity }) ?? 1,
      offsetMinutes: numberOrNull({ value: part.offsetMinutes }) ?? 0,
      durationMinutes: numberOrNull({ value: part.durationMinutes }),
      required: part.required,
    }));
}

type CustomisationGroupsInput = { customisationGroups: CustomisationGroupFormValue[] };

/** Raw groups → core's `customisationGroups`; option rows without an item are left out. */
function customisationGroupsToInput({ customisationGroups }: CustomisationGroupsInput) {
  return customisationGroups.map((group) => ({
    name: group.name.trim(),
    minPick: numberOrNull({ value: group.minPick }) ?? 0,
    maxPick: numberOrNull({ value: group.maxPick }) ?? 1,
    options: group.options.filter((option) => option.itemId !== ""),
  }));
}

/** Fields of the capabilities the type has; sections of other capabilities are left out. */
function capabilityInput({ values, type }: Omit<ItemInputArgs, "specs">) {
  const kr = numberOrNull({ value: values.price });
  return {
    ...(hasCapability({ type, capability: "PRICED" })
      ? {
          priceMinor: kr === null ? null : Math.round(kr * 100),
          priceUnit: kr === null ? null : values.priceUnit,
          vatRatePercent: numberOrNull({ value: values.vatRatePercent }),
        }
      : {}),
    ...(hasCapability({ type, capability: "BOOKABLE" })
      ? { defaultDurationMinutes: numberOrNull({ value: values.defaultDurationMinutes }) }
      : {}),
    ...(hasCapability({ type, capability: "SETUPS" })
      ? {
          setups: Object.entries(values.setups)
            .filter(([, capacity]) => capacity.trim() !== "")
            .map(([setupId, capacity]) => ({ setupId, capacity: Number(capacity) })),
        }
      : {}),
    ...(hasCapability({ type, capability: "BUNDLE" })
      ? { parts: partsToInput({ parts: values.parts }) }
      : {}),
    ...(hasCapability({ type, capability: "CUSTOMISATIONS" })
      ? { customisationGroups: customisationGroupsToInput(values) }
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
    ...bufferFormToInput({ values }),
    ...capabilityInput({ values, type }),
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
