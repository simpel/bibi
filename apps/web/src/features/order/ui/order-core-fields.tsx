import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { DateTimeField } from "@/components/date-picker/date-time-field";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { ContactOption } from "./order-form-data";
import type { OrderFormOutput } from "./order-form-schema";
import type { OrderFormValues } from "./order-form-values";

type Form = UseFormReturn<OrderFormValues, unknown, OrderFormOutput>;

export type OrderCoreFieldsProps = {
  form: Form;
  data: {
    customers: readonly NamedOption[];
    contacts: readonly ContactOption[];
    /** The caller may not view customers (and their contacts): both pickers are disabled. */
    customersHidden: boolean;
  };
};

/** Optional: left empty, a title is generated after an order is created. */
function TitleField({ form }: { form: Form }) {
  const t = useTranslations("order.fields");
  return (
    <TextField form={form} name="title" label={t("title")} placeholder={t("titlePlaceholder")} />
  );
}

/** Business or private for this order only; by default it follows the customer (ADR 0106). */
function BuyerKindField({ form }: { form: Form }) {
  const t = useTranslations("order.fields");
  const kinds = useTranslations("customer.buyerKind");
  const options = [
    { id: "BUSINESS", name: kinds("BUSINESS") },
    { id: "PRIVATE", name: kinds("PRIVATE") },
  ];
  return (
    <OptionSelectField
      control={form.control}
      name="buyerKind"
      label={t("buyerKind")}
      options={options}
      noneLabel={t("buyerKindFromCustomer")}
    />
  );
}

/** Customer and a contact person who works there (the list follows the customer). */
function CustomerFields({ form, data }: OrderCoreFieldsProps) {
  const { customers, contacts, customersHidden: hidden } = data;
  const t = useTranslations("order.fields");
  const ofCustomer = contacts.filter(({ customerId }) => customerId === form.watch("customerId"));
  return (
    <>
      <OptionSelectField
        control={form.control}
        name="customerId"
        label={t("customer")}
        options={customers}
        hidden={hidden}
        onChange={() => form.setValue("contactId", "")}
      />
      <OptionSelectField
        control={form.control}
        name="contactId"
        label={t("contact")}
        options={ofCustomer}
        hidden={hidden}
      />
      <BuyerKindField form={form} />
      <TextField
        form={form}
        name="buyerReference"
        label={t("buyerReference")}
        placeholder={t("buyerReferencePlaceholder")}
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
  type: "number";
};

/** The desired period, the counts, the budget and when soft holds expire; all optional. */
function DetailFields({ form }: { form: Form }) {
  const t = useTranslations("order.fields");
  const field = ({ name, type }: DetailInput) => (
    <TextField form={form} name={name} label={t(name)} type={type} />
  );
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <DateTimeField form={form} name="desiredStartsAt" label={t("desiredStartsAt")} />
        <DateTimeField form={form} name="desiredEndsAt" label={t("desiredEndsAt")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field({ name: "estimatedHeadcount", type: "number" })}
        {field({ name: "guaranteedHeadcount", type: "number" })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="budget" label={t("budget")} type="number" step="0.01" />
        <TextField
          form={form}
          name="estimatedValue"
          label={t("estimatedValue")}
          type="number"
          step="0.01"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DateTimeField form={form} name="holdsUntil" label={t("holdsUntil")} />
      </div>
      <TextField form={form} name="note" label={t("note")} multiline rows={4} />
    </>
  );
}

/** Customer, contact, desired period, counts and budget (the type's own fields come after). */
export function OrderCoreFields(props: OrderCoreFieldsProps) {
  return (
    <>
      <TitleField form={props.form} />
      <CustomerFields {...props} />
      <DetailFields form={props.form} />
    </>
  );
}
