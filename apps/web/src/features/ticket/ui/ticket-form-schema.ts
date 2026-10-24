import type { EntityTypeDto, TicketDto, TicketUpdateInput, VocabularyDto } from "@bibi/core";
import { buildFieldsSchema, TicketCreateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsPatch, fieldsToInput } from "@/components/typed-fields/raw-fields";
import { minorOrNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { TicketFormValues } from "./ticket-form-values";

/** What the resolver outputs: core's create input (the assignee is set with `assignment.assign`). */
export type TicketFormOutput = z.infer<typeof TicketCreateInputSchema>;

export type TicketSchemaInput = {
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
  /** The organization's zone: ticket-level times are entered in it (ADR 0064). */
  timeZone: string;
};

/** Core's ticket schema with `fields` checked against the type; the server validates again. */
export function ticketFormSchema({ type, vocabularies, timeZone }: TicketSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  const instant = ({ value }: { value: string }) =>
    fromLocalInputValue({ value, timeZone }) ?? null;
  return formSchema({
    schema: TicketCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: TicketFormValues }) => ({
      entityTypeId: values.entityTypeId,
      customerId: values.customerId,
      contactId: values.contactId === NONE || values.contactId === "" ? null : values.contactId,
      desiredStartsAt: instant({ value: values.desiredStartsAt }),
      desiredEndsAt: instant({ value: values.desiredEndsAt }),
      estimatedHeadcount: numberOrNull({ value: values.estimatedHeadcount }),
      guaranteedHeadcount: numberOrNull({ value: values.guaranteedHeadcount }),
      budgetMinor: minorOrNull({ value: values.budget }),
      holdsUntil: instant({ value: values.holdsUntil }),
      fields: fieldsToInput({ values, specs }),
    }),
  });
}

export type TicketUpdateArgs = {
  ticket: TicketDto;
  values: TicketFormOutput;
  type: EntityTypeDto | undefined;
};

/** Create-shaped values → `ticket.update` input; emptied fields are cleared with `null`. */
export function toTicketUpdate({ ticket, values, type }: TicketUpdateArgs): TicketUpdateInput {
  const { entityTypeId: _type, assigneeId: _assignee, fields, ...rest } = values;
  return {
    id: ticket.id,
    ...rest,
    fields: fieldsPatch({ type, stored: ticket.fields, fields }),
  };
}
