import type { CreateDraftLine, EntityTypeDto, VocabularyDto } from "@bibi/core";
import { buildFieldsSchema, CreateDraftLineSchema } from "@bibi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsToInput } from "@/components/typed-fields/raw-fields";
import { blankToNull, minorOrNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { groupOptions } from "../../line/ui/choose-options-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";
import { periodOf } from "./intake-period";
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
};

type TimesInput = Pick<LineSchemaInput, "date" | "timeZone"> & { values: LineFormValues };

/** Both empty: untimed. One of them: kept, so the schema's period rule names the gap. */
function times({ values, date, timeZone }: TimesInput) {
  const { from, to } = values;
  if (!from && !to) return { startsAt: null, endsAt: null };
  if (!from || !to) {
    const lone = fromLocalInputValue({ value: `${date}T${from || to}`, timeZone }) ?? null;
    return from ? { startsAt: lone, endsAt: null } : { startsAt: null, endsAt: lone };
  }
  const period = periodOf({ when: { date, from, to, guests: 0 }, timeZone });
  return { startsAt: period?.startsAt ?? null, endsAt: period?.endsAt ?? null };
}

const options = ({ item, values }: { item: CatalogItem | null; values: LineFormValues }) =>
  (item?.groups ?? []).flatMap((group, index) =>
    groupOptions({ group, value: values.groups[index] ?? { picked: [], quantities: {} } }),
  );

/** Core's draft line schema (as `ticket.create` takes it) over the dialog's raw values. */
export function lineFormSchema({
  type,
  vocabularies,
  item,
  date,
  timeZone,
  needTypeId,
}: LineSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  const schema = CreateDraftLineSchema.extend({ fields: buildFieldsSchema({ specs }) });
  return formSchema({
    schema: schema.refine(({ startsAt, endsAt }) => (startsAt === null) === (endsAt === null), {
      path: ["to"],
    }),
    toInput: ({ values }: { values: LineFormValues }) => ({
      entityTypeId: values.entityTypeId,
      name: values.name,
      itemId: item?.id ?? null,
      setupId: item && values.setupId !== NONE ? values.setupId : null,
      ...times({ date, timeZone, values }),
      quantity: numberOrNull({ value: values.quantity }),
      unitPriceMinor: minorOrNull({ value: values.unitPrice }),
      discountPercent: numberOrNull({ value: values.discountPercent }),
      note: blankToNull({ value: values.note }),
      options: options({ item, values }),
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
    fields: line.fields ?? {},
  };
}
