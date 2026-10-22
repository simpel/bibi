import type { CustomerDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { customerRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { createCustomerAction, updateCustomerAction } from "../actions";
import {
  type CustomerFormOutput,
  customerFormSchema,
  toCustomerUpdate,
} from "./customer-form-schema";
import { type CustomerFormValues, customerFormDefaults } from "./customer-form-values";

export type UseCustomerFormInput = {
  data: TypedFormData;
  /** Present = edit mode, absent = create mode. */
  customer?: CustomerDto | undefined;
  onDone: () => void;
};

/** Customer form state; the resolver checks the selected type's own fields. */
export function useCustomerForm({ data, customer, onDone }: UseCustomerFormInput) {
  const t = useTranslations("customer");
  const router = useRouter();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<CustomerFormValues, CustomerFormOutput>({
    types: data.types,
    schemaFor: ({ type }) => customerFormSchema({ type, vocabularies: data.vocabularies }),
  });
  const initial = typeOf({ id: customer?.entityTypeId ?? data.types[0]?.id ?? "" });
  const form = useForm<CustomerFormValues, unknown, CustomerFormOutput>({
    resolver,
    defaultValues: customerFormDefaults({ type: initial, customer }),
  });
  const { submit, run, pending } = useFormAction({
    form,
    action: ({ values }) =>
      customer
        ? updateCustomerAction({
            input: toCustomerUpdate({
              customer,
              values,
              type: typeOf({ id: customer.entityTypeId }),
            }),
          })
        : createCustomerAction({ input: values }),
    messages: { pending: t("saving"), success: t(customer ? "updated" : "created") },
    onSuccess: ({ value }) => {
      router.refresh();
      if (customer) onDone();
      else router.push(customerRoute({ id: value.id }));
    },
  });
  return { form, submit, run, pending, typeOf };
}
