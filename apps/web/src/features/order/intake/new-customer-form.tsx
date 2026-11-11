import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { EmailField } from "@/components/form/email-field";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { CustomerOption } from "../../customer/actions";
import { SimilarCustomers } from "./similar-customers";
import { type UseNewCustomerFormInput, useNewCustomerForm } from "./use-new-customer-form";

export type NewCustomerFormProps = UseNewCustomerFormInput & {
  /** A likely duplicate was chosen instead. */
  onUse: (input: { customer: CustomerOption }) => void;
  onCancel: () => void;
};

type FieldsProps = { customerTypes: NamedOption[]; contactTypes: NamedOption[] } & {
  form: ReturnType<typeof useNewCustomerForm>["form"];
};

function NewCustomerFields({ form, customerTypes, contactTypes }: FieldsProps) {
  const t = useTranslations("orderIntake.who");
  const fields = useTranslations("customer.fields");
  const kinds = useTranslations("customer.buyerKind");
  const business = form.watch("buyerKind") !== "PRIVATE";
  const kindOptions = [
    { id: "BUSINESS", name: kinds("BUSINESS") },
    { id: "PRIVATE", name: kinds("PRIVATE") },
  ];
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      <TextField form={form} name="name" label={t("customerName")} required />
      <OptionSelectField
        control={form.control}
        name="entityTypeId"
        label={t("customerType")}
        options={customerTypes}
      />
      <OptionSelectField
        control={form.control}
        name="buyerKind"
        label={fields("buyerKind")}
        options={kindOptions}
      />
      {business ? (
        <TextField form={form} name="organizationNumber" label={fields("organizationNumber")} />
      ) : null}
      <TextField form={form} name="contact.name" label={t("contactName")} required />
      <EmailField form={form} name="contact.email" label={t("contactEmail")} required />
      {contactTypes.length > 1 ? (
        <OptionSelectField
          control={form.control}
          name="contact.entityTypeId"
          label={t("contactType")}
          options={contactTypes}
        />
      ) : null}
    </div>
  );
}

/**
 * A new customer with its first contact person in one command (`customer.create`, ADR 0081). A
 * name not checked yet is checked first: "looks like" shows here, the values kept.
 */
export function NewCustomerForm(props: NewCustomerFormProps) {
  const t = useTranslations("orderIntake.who");
  const common = useTranslations("common");
  const { form, submit, pending, similar, createAnyway } = useNewCustomerForm(props);
  return (
    <Form {...form}>
      <form className="grid gap-4 rounded-md border p-4" onSubmit={submit} noValidate>
        <h3 className="text-sm">{t("newCustomerTitle")}</h3>
        <NewCustomerFields {...props} form={form} />
        {similar ? (
          <SimilarCustomers
            name={similar.values.name}
            matches={similar.matches}
            onUse={props.onUse}
            onNew={createAnyway}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending || similar !== null}>
            {t("createCustomer")}
          </Button>
          <Button type="button" variant="ghost" onClick={props.onCancel}>
            {common("cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
