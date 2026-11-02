import type { CreateDraftLine, EntityTypeDto, VocabularyDto } from "@bibi/core";
import { buildFieldsSchema, CreateDraftLineSchema } from "@bibi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsToInput } from "@/components/typed-fields/raw-fields";
import { blankToNull, minorOrNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { chosenOptionsOf } from "../../line/ui/choose-options-schema";
import type { PickRuleText } from "../../line/ui/group-pick-rule";
import { withGroupRules } from "../../line/ui/group-rules-schema";
import { splitPicks } from "../../line/ui/split-picks";
import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";
import { addOnInputs } from "./line-add-ons-form";
import { formTimes } from "./line-form-times";
import type { LineFormValues } from "./line-form-values";

export type LineSchemaInput = {
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
  item: CatalogItem | null;
  /** The line's day (read-only in the dialog), YYYY-MM-DD. */
  date: string;
  /** The item's zone, else the organization's (ADR 0064). */
  timeZone: string;
  /** The requirement type needs are counted with. */
  needTypeId: string | null;
  /** A broken group pick rule's message ("Choose 1"). */
  ruleText: PickRuleText;
};

const picks = ({ item, values }: { item: CatalogItem | null; values: LineFormValues }) =>
  splitPicks({ groups: item?.groups ?? [], picked: values.groups });

/**
 * Core's draft line schema (as `ticket.create` takes it) over the dialog's raw values, after the
 * item's group pick rules as `ticket.create` checks them (only once something is chosen). Picks
 * beyond the max of a group that allows extras are add-ons (ADR 0088), not a broken rule.
 */
export function lineFormSchema({ item, ruleText, ...input }: LineSchemaInput) {
  const raw = rawLineSchema({ ...input, item });
  return withGroupRules<LineFormValues, typeof raw>({
    ...{ schema: raw, groups: item?.groups ?? [], ruleText, skipWhenNone: true, extras: true },
    chosen: ({ values }) => chosenOptionsOf({ groups: item?.groups ?? [], values }),
  });
}

type DetailsInput = Pick<LineSchemaInput, "item" | "date" | "timeZone"> & {
  values: LineFormValues;
};

/** The line's own values, its options and its add-ons (extra picks after the added items). */
function lineDetailsInput({ values, item, date, timeZone }: DetailsInput) {
  const { options, extras } = picks({ item, values });
  return {
    entityTypeId: values.entityTypeId,
    name: values.name,
    itemId: item?.id ?? null,
    setupId: item && values.setupId !== NONE ? values.setupId : null,
    ...formTimes({ date, timeZone, values }),
    quantity: numberOrNull({ value: values.quantity }),
    unitPriceMinor: minorOrNull({ value: values.unitPrice }),
    discountPercent: numberOrNull({ value: values.discountPercent }),
    note: blankToNull({ value: values.note }),
    options,
    addOns: addOnInputs({ rows: values.addOns, extras, date, timeZone }),
  };
}

function rawLineSchema({
  type,
  vocabularies,
  item,
  date,
  timeZone,
  needTypeId,
}: Omit<LineSchemaInput, "ruleText">) {
  const specs = specsOf({ type, vocabularies });
  const schema = CreateDraftLineSchema.extend({ fields: buildFieldsSchema({ specs }) });
  return formSchema({
    schema: schema
      .refine(({ startsAt, endsAt }) => (startsAt === null) === (endsAt === null), {
        path: ["to"],
      })
      .superRefine(({ addOns }, context) => {
        for (const [index, addOn] of (addOns ?? []).entries()) {
          if ((addOn.startsAt == null) === (addOn.endsAt == null)) continue;
          context.addIssue({ code: "custom", path: ["addOns", index, "to"] });
        }
      }),
    toInput: ({ values }: { values: LineFormValues }) => ({
      ...lineDetailsInput({ values, item, date, timeZone }),
      requirements: needTypeId
        ? values.needs
            .filter(({ valueId }) => valueId !== "" && valueId !== NONE)
            .map(({ valueId, count }) => ({
              ...{ entityTypeId: needTypeId, vocabularyValueId: valueId },
              quantity: numberOrNull({ value: count }) ?? 0,
            }))
        : [],
      fields: fieldsToInput({ values, specs }),
    }),
  });
}

const iso = ({ at }: { at: Date | null | undefined }) => (at ? at.toISOString() : null);

/** The validated dialog as the review keeps it. */
export function toDraftLine({ line, key }: { line: CreateDraftLine; key: string }): DraftLine {
  return {
    ...{ key, entityTypeId: line.entityTypeId, name: line.name },
    ...{ itemId: line.itemId ?? null, setupId: line.setupId ?? null },
    ...{ startsAt: iso({ at: line.startsAt }), endsAt: iso({ at: line.endsAt }) },
    quantity: line.quantity ?? null,
    unitPriceMinor: line.unitPriceMinor ?? null,
    discountPercent: line.discountPercent ?? null,
    note: line.note ?? null,
    options: (line.options ?? []).map(({ itemId, quantity }) => ({
      itemId,
      quantity: quantity ?? null,
    })),
    needs: (line.requirements ?? []).map(({ entityTypeId, vocabularyValueId, quantity }) => ({
      ...{ entityTypeId, vocabularyValueId, quantity },
    })),
    addOns: (line.addOns ?? []).map((addOn, index) => ({
      ...{ key: `${key}.${index}`, itemId: addOn.itemId ?? null, name: addOn.name ?? "" },
      ...{ quantity: addOn.quantity ?? null, unitPriceMinor: addOn.unitPriceMinor ?? null },
      ...{ startsAt: iso({ at: addOn.startsAt }), endsAt: iso({ at: addOn.endsAt }) },
    })),
    fields: line.fields ?? {},
  };
}
