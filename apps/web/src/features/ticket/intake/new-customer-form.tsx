import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { type CustomerOption, createCustomerAction } from "../../customer/actions";
import {
  type NewCustomerOutput,
  type NewCustomerValues,
  newCustomerDefaults,
  newCustomerSchema,
} from "./new-customer-schema";

export type NewCustomerFormProps = {
  name: string;
  customerTypes: NamedOption[];
  contactTypes: NamedOption[];
  onCreated: (input: { customer: CustomerOption }) => void;
  onCancel: () => void;
};

type FormInput = Pick<
  NewCustomerFormProps,
  "name" | "customerTypes" | "contactTypes" | "onCreated"
>;

function useNewCustomerForm({ name, customerTypes, contactTypes, onCreated }: FormInput) {
  const customer = useTranslations("customer");
  const common = useTranslations("common");
  const form = useForm<NewCustomerValues, unknown, NewCustomerOutput>({
    resolver: zodResolver(newCustomerSchema, useZodMessages()),
    defaultValues: newCustomerDefaults({
      name,
      customerTypeId: customerTypes[0]?.id,
      contactTypeId: contactTypes[0]?.id,
    }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createCustomerAction({ input: values }),
    messages: { pending: common("saving"), success: customer("created") },
    onSuccess: ({ value }) => onCreated({ customer: { id: value.id, name: value.name } }),
  });
  return { form, submit, pending };
}

type FieldsProps = Pick<NewCustomerFormProps, "customerTypes" | "contactTypes"> & {
  form: ReturnType<typeof useNewCustomerForm>["form"];
};

function NewCustomerFields({ form, customerTypes, contactTypes }: FieldsProps) {
  const t = useTranslations("ticketIntake.who");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField form={form} name="name" label={t("customerName")} required />
      <OptionSelectField
        control={form.control}
        name="entityTypeId"
        label={t("customerType")}
        options={customerTypes}
      />
      <TextField form={form} name="contact.name" label={t("contactName")} required />
      <TextField form={form} name="contact.email" label={t("contactEmail")} type="email" required />
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

/** A new customer with its first contact person in one command (`customer.create`, ADR 0081). */
export function NewCustomerForm(props: NewCustomerFormProps) {
  const t = useTranslations("ticketIntake.who");
  const common = useTranslations("common");
  const { form, submit, pending } = useNewCustomerForm(props);
  return (
    <Form {...form}>
      <form className="grid gap-4 rounded-md border p-4" onSubmit={submit} noValidate>
        <h3 className="text-sm font-semibold">{t("newCustomerTitle")}</h3>
        <NewCustomerFields {...props} form={form} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
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
