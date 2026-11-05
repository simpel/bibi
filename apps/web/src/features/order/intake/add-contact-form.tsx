import type { ContactDto } from "@bibi/core";
import { ContactCreateInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { EmailField } from "@/components/form/email-field";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createContactAction } from "../../contact/actions";

/** `contact.create` with the email required, as the intake asks for it (ADR 0081). */
const addContactSchema = ContactCreateInputSchema.extend({ email: z.email() });

type AddContactValues = { customerId: string; entityTypeId: string; name: string; email: string };
type AddContactOutput = z.infer<typeof addContactSchema>;

export type AddContactFormProps = {
  customer: { id: string; name: string };
  contactTypes: NamedOption[];
  onCreated: (input: { contact: ContactDto }) => void;
};

function useAddContactForm({ customer, contactTypes, onCreated }: AddContactFormProps) {
  const t = useTranslations("contact");
  const common = useTranslations("common");
  const form = useForm<AddContactValues, unknown, AddContactOutput>({
    mode: "onBlur",
    resolver: zodResolver(addContactSchema, useZodMessages()),
    defaultValues: {
      customerId: customer.id,
      entityTypeId: contactTypes[0]?.id ?? "",
      name: "",
      email: "",
    },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createContactAction({ input: values }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: ({ value }) => onCreated({ contact: value }),
  });
  return { form, submit, pending };
}

/** "<customer> has no contact person. Add one to continue." with name and email. */
export function AddContactForm(props: AddContactFormProps) {
  const t = useTranslations("orderIntake.who");
  const { form, submit, pending } = useAddContactForm(props);
  return (
    <Form {...form}>
      <form className="grid gap-4 rounded-md border p-4" onSubmit={submit} noValidate>
        <p className="text-sm">{t("noContact", { customer: props.customer.name })}</p>
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <TextField form={form} name="name" label={t("contactName")} required />
          <EmailField form={form} name="email" label={t("contactEmail")} required />
          {props.contactTypes.length > 1 ? (
            <OptionSelectField
              control={form.control}
              name="entityTypeId"
              label={t("contactType")}
              options={props.contactTypes}
            />
          ) : null}
        </div>
        <Button type="submit" className="justify-self-start" disabled={pending}>
          {t("addContact")}
        </Button>
      </form>
    </Form>
  );
}
