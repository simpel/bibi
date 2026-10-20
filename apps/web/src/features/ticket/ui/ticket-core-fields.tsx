import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { NONE, OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { ContactOption } from "./ticket-form-data";
import type { TicketFormOutput } from "./ticket-form-schema";
import type { TicketFormValues } from "./ticket-form-values";

type Form = UseFormReturn<TicketFormValues, unknown, TicketFormOutput>;

export type TicketCoreFieldsProps = {
  form: Form;
  data: {
    customers: readonly NamedOption[];
    contacts: readonly ContactOption[];
    /** The caller may not view customers (and their contacts): both pickers are disabled. */
    customersHidden: boolean;
  };
};

/** Customer and a contact person who works there (the list follows the customer). */
function CustomerFields({ form, data }: TicketCoreFieldsProps) {
  const { customers, contacts, customersHidden: hidden } = data;
  const t = useTranslations("ticket.fields");
  const ofCustomer = contacts.filter(({ customerId }) => customerId === form.watch("customerId"));
  return (
    <>
      <OptionSelectField
        control={form.control}
        name="customerId"
        label={t("customer")}
        options={customers}
        hidden={hidden}
        onChange={() => form.setValue("contactId", NONE)}
      />
      <OptionSelectField
        control={form.control}
        name="contactId"
        label={t("contact")}
        options={ofCustomer}
        hidden={hidden}
        noneLabel={t("noContact")}
      />
    </>
  );
}

type DetailInput = {
  name:
    | "desiredStartsAt"
    | "desiredEndsAt"
    | "estimatedHeadcount"
    | "guaranteedHeadcount"
    | "holdsUntil";
  type: "datetime-local" | "number";
};

/** The desired period, the counts, the budget and when soft holds expire; all optional. */
function DetailFields({ form }: { form: Form }) {
  const t = useTranslations("ticket.fields");
  const field = ({ name, type }: DetailInput) => (
    <TextField form={form} name={name} label={t(name)} type={type} />
  );
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {field({ name: "desiredStartsAt", type: "datetime-local" })}
        {field({ name: "desiredEndsAt", type: "datetime-local" })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field({ name: "estimatedHeadcount", type: "number" })}
        {field({ name: "guaranteedHeadcount", type: "number" })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="budget" label={t("budget")} type="number" step="0.01" />
        {field({ name: "holdsUntil", type: "datetime-local" })}
      </div>
    </>
  );
}

/** Customer, contact, desired period, counts and budget (the type's own fields come after). */
export function TicketCoreFields(props: TicketCoreFieldsProps) {
  return (
    <>
      <CustomerFields {...props} />
      <DetailFields form={props.form} />
    </>
  );
}
