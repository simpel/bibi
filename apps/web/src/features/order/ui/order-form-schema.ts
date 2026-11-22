import type { EntityTypeDto, OrderDto, OrderUpdateInput, VocabularyDto } from "@bibi/core";
import { buildFieldsSchema, OrderCreateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsPatch, fieldsToInput } from "@/components/typed-fields/raw-fields";
import { minorOrNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { OrderFormValues } from "./order-form-values";

/** What the resolver outputs: core's create input (the assignee is set with `assignment.assign`). */
export type OrderFormOutput = z.infer<typeof OrderCreateInputSchema>;

export type OrderSchemaInput = {
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
  /** The organization's zone: order-level times are entered in it (ADR 0064). */
  timeZone: string;
};

/** Core's order schema with `fields` checked against the type; the server validates again. */
export function orderFormSchema({ type, vocabularies, timeZone }: OrderSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  const instant = ({ value }: { value: string }) =>
    fromLocalInputValue({ value, timeZone }) ?? null;
  return formSchema({
    schema: OrderCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: OrderFormValues }) => ({
      title: values.title.trim() === "" ? null : values.title,
      entityTypeId: values.entityTypeId,
      customerId: values.customerId,
      contactId: values.contactId,
      buyerKind: values.buyerKind === NONE ? null : values.buyerKind,
      buyerReference: values.buyerReference.trim() === "" ? null : values.buyerReference,
      desiredStartsAt: instant({ value: values.desiredStartsAt }),
      desiredEndsAt: instant({ value: values.desiredEndsAt }),
      estimatedHeadcount: numberOrNull({ value: values.estimatedHeadcount }),
      guaranteedHeadcount: numberOrNull({ value: values.guaranteedHeadcount }),
      budgetMinor: minorOrNull({ value: values.budget }),
      estimatedValueMinor: minorOrNull({ value: values.estimatedValue }),
      holdsUntil: instant({ value: values.holdsUntil }),
      note: values.note.trim() === "" ? null : values.note,
      fields: fieldsToInput({ values, specs }),
    }),
  });
}

/** The parts of an order edited in place, each by the page element that shows it. */
export type OrderEditGroup = "party" | "period" | "headcount" | "buyer" | "money" | "fields";

const GROUP_KEYS = {
  party: ["customerId", "contactId"],
  period: ["desiredStartsAt", "desiredEndsAt"],
  headcount: ["estimatedHeadcount", "guaranteedHeadcount"],
  buyer: ["buyerKind", "buyerReference"],
  money: ["budgetMinor", "estimatedValueMinor", "holdsUntil", "note"],
  fields: [],
} as const satisfies Record<OrderEditGroup, readonly (keyof OrderUpdateInput)[]>;

export type OrderUpdateArgs = {
  order: OrderDto;
  values: OrderFormOutput;
  type: EntityTypeDto | undefined;
  /** Only these parts are sent: a closed order still takes its buyer fields (ADR 0106). */
  groups: readonly OrderEditGroup[];
};

/** Create-shaped values → `order.update` input for the edited parts; emptied ones are `null`. */
export function toOrderUpdate({ order, values, type, groups }: OrderUpdateArgs): OrderUpdateInput {
  const input: OrderUpdateInput = { id: order.id };
  for (const group of groups) {
    for (const key of GROUP_KEYS[group]) Object.assign(input, { [key]: values[key] });
  }
  if (groups.includes("fields")) {
    input.fields = fieldsPatch({ type, stored: order.fields, fields: values.fields });
  }
  return input;
}
