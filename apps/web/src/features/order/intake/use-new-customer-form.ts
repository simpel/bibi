import type { SimilarCustomer } from "@bibi/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type CustomerOption,
  createCustomerAction,
  findSimilarCustomersAction,
} from "../../customer/actions";
import {
  type NewCustomerOutput,
  type NewCustomerValues,
  newCustomerDefaults,
  newCustomerSchema,
} from "./new-customer-schema";

export type UseNewCustomerFormInput = {
  name: string;
  /** The name already checked for duplicates (from the search), or null. */
  checkedName: string | null;
  customerTypes: NamedOption[];
  contactTypes: NamedOption[];
  onCreated: (input: { customer: CustomerOption }) => void;
};

/** Likely duplicates of the name about to be created, with the values to create anyway. */
export type SimilarCheck = { matches: SimilarCustomer[]; values: NewCustomerOutput };

/**
 * The new-customer form: `customer.create` with the nested contact (ADR 0081), after
 * `customer.findSimilar` for a name not checked yet. Matches wait for "Use" or "No, it is new".
 */
export function useNewCustomerForm({
  name,
  checkedName,
  customerTypes,
  contactTypes,
  onCreated,
}: UseNewCustomerFormInput) {
  const customer = useTranslations("customer");
  const common = useTranslations("common");
  const [checked, setChecked] = useState(checkedName);
  const [similar, setSimilar] = useState<SimilarCheck | null>(null);
  const [checking, startCheck] = useTransition();
  const form = useForm<NewCustomerValues, unknown, NewCustomerOutput>({
    mode: "onBlur",
    resolver: zodResolver(newCustomerSchema, useZodMessages()),
    defaultValues: newCustomerDefaults({
      ...{ name, customerTypeId: customerTypes[0]?.id, contactTypeId: contactTypes[0]?.id },
    }),
  });
  const { run, pending } = useFormAction({
    form,
    action: ({ values }) => createCustomerAction({ input: values }),
    messages: { pending: common("saving"), success: customer("created") },
    onSuccess: ({ value }) => onCreated({ customer: { id: value.id, name: value.name } }),
  });
  const submit = form.handleSubmit((values) => {
    if (values.name === checked) return run({ values });
    startCheck(async () => {
      const result = await findSimilarCustomersAction({ name: values.name }).catch(() => null);
      const matches = result?.ok ? result.value.items : [];
      setChecked(values.name);
      if (matches.length > 0) setSimilar({ matches, values });
      else run({ values });
    });
  });
  const createAnyway = () => {
    if (similar) run({ values: similar.values });
    setSimilar(null);
  };
  return { form, submit, pending: pending || checking, similar, createAnyway };
}
