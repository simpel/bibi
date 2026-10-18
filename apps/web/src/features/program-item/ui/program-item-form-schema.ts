import type {
  EntityTypeDto,
  ProgramItemDto,
  ProgramItemUpdateInput,
  VocabularyDto,
} from "@okazi/core";
import { buildFieldsSchema, ProgramItemCreateInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsPatch, fieldsToInput } from "@/components/typed-fields/raw-fields";
import { blankToNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { ProgramItemFormValues } from "./program-item-form-values";

/** What the resolver outputs: core's create input. */
export type ProgramItemFormOutput = z.infer<typeof ProgramItemCreateInputSchema>;

const picked = ({ value }: { value: string }) => (value === NONE || value === "" ? null : value);

export type ProgramItemSchemaInput = {
  ticketId: string;
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
};

/** Core's program item schema with `fields` checked against the type; the server checks again. */
export function programItemFormSchema({ ticketId, type, vocabularies }: ProgramItemSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  return formSchema({
    schema: ProgramItemCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: ProgramItemFormValues }) => {
      const itemId = picked({ value: values.itemId });
      return {
        ticketId,
        entityTypeId: values.entityTypeId,
        name: values.name,
        startsAt: fromLocalInputValue({ value: values.startsAt }),
        endsAt: fromLocalInputValue({ value: values.endsAt }),
        itemId,
        setupId: itemId ? picked({ value: values.setupId }) : null,
        quantity: numberOrNull({ value: values.quantity }),
        note: blankToNull({ value: values.note }),
        fields: fieldsToInput({ values, specs }),
      };
    },
  });
}

export type ProgramItemUpdateArgs = {
  programItem: ProgramItemDto;
  values: ProgramItemFormOutput;
  type: EntityTypeDto | undefined;
};

/** Create-shaped values → `programItem.update` input (ticket and type are fixed). */
export function toProgramItemUpdate({
  programItem,
  values,
  type,
}: ProgramItemUpdateArgs): ProgramItemUpdateInput {
  const { ticketId: _b, entityTypeId: _t, fields, ...rest } = values;
  return {
    id: programItem.id,
    ...rest,
    fields: fieldsPatch({ type, stored: programItem.fields, fields }),
  };
}
