import type { EntityTypeDto, LineDto, LineUpdateInput, VocabularyDto } from "@okazi/core";
import { buildFieldsSchema, LineCreateInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { bufferFormToInput } from "@/components/form/buffer-values";
import { NONE } from "@/components/form/option-select-field";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsPatch, fieldsToInput } from "@/components/typed-fields/raw-fields";
import { blankToNull, minorOrNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { LineFormValues } from "./line-form-values";

/** What the resolver outputs: core's create input. */
export type LineFormOutput = z.infer<typeof LineCreateInputSchema>;

const picked = ({ value }: { value: string }) => (value === NONE || value === "" ? null : value);

export type LineSchemaInput = {
  ticketId: string;
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
};

/** Core's line schema with `fields` checked against the type; the server checks again. */
export function lineFormSchema({ ticketId, type, vocabularies }: LineSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  return formSchema({
    schema: LineCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: LineFormValues }) => {
      const itemId = picked({ value: values.itemId });
      return {
        ticketId,
        entityTypeId: values.entityTypeId,
        name: values.name,
        // Both empty = an untimed line (ADR 0052).
        startsAt: fromLocalInputValue({ value: values.startsAt }) ?? null,
        endsAt: fromLocalInputValue({ value: values.endsAt }) ?? null,
        itemId,
        setupId: itemId ? picked({ value: values.setupId }) : null,
        ...bufferFormToInput({ values }),
        quantity: numberOrNull({ value: values.quantity }),
        unitPriceMinor: minorOrNull({ value: values.unitPrice }),
        discountPercent: numberOrNull({ value: values.discountPercent }),
        vatRatePercent: numberOrNull({ value: values.vatRatePercent }),
        note: blankToNull({ value: values.note }),
        fields: fieldsToInput({ values, specs }),
      };
    },
  });
}

export type LineUpdateArgs = {
  line: LineDto;
  values: LineFormOutput;
  type: EntityTypeDto | undefined;
};

/** Create-shaped values → `line.update` input (ticket and type are fixed). */
export function toLineUpdate({ line, values, type }: LineUpdateArgs): LineUpdateInput {
  const { ticketId: _b, entityTypeId: _t, fields, ...rest } = values;
  return {
    id: line.id,
    ...rest,
    fields: fieldsPatch({ type, stored: line.fields, fields }),
  };
}
