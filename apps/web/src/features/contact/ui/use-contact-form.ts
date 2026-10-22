import type { ContactDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useFormAction } from "@/lib/use-form-action";
import { createContactAction, updateContactAction } from "../actions";
import {
  type ContactFormOutput,
  type ContactFormValues,
  contactFormDefaults,
  contactFormSchema,
  toContactUpdate,
} from "./contact-form-schema";

export type UseContactFormInput = {
  customerId: string;
  data: TypedFormData;
  /** Present = edit mode, absent = create mode. */
  contact?: ContactDto | undefined;
  onDone: () => void;
};

/** Contact form state; the resolver checks the selected type's own fields. */
export function useContactForm({ customerId, data, contact, onDone }: UseContactFormInput) {
  const t = useTranslations("contact");
  const router = useRouter();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<ContactFormValues, ContactFormOutput>({
    types: data.types,
    schemaFor: ({ type }) =>
      contactFormSchema({ customerId, type, vocabularies: data.vocabularies }),
  });
  const initial = typeOf({ id: contact?.entityTypeId ?? data.types[0]?.id ?? "" });
  const form = useForm<ContactFormValues, unknown, ContactFormOutput>({
    resolver,
    defaultValues: contactFormDefaults({ type: initial, ...(contact ? { contact } : {}) }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      contact
        ? updateContactAction({
            input: toContactUpdate({ contact, values, type: typeOf({ id: contact.entityTypeId }) }),
          })
        : createContactAction({ input: values }),
    messages: { pending: t("saving"), success: t(contact ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending, typeOf };
}
