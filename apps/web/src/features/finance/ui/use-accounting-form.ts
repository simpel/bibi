import {
  type AccountingSettingsDto,
  AccountingSettingsUpdateInputSchema,
} from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useZodMessages } from "@/lib/use-zod-messages";
import {
  type AccountingFormValues,
  type ItemTypeOption,
  keptRevenueRows,
  toFormValues,
  toUpdateInput,
} from "../lib/accounting-form";

type Output = z.output<typeof AccountingSettingsUpdateInputSchema>;

export type UseAccountingFormInput = { settings: AccountingSettingsDto; types: ItemTypeOption[] };

/** The form: raw string values in, the core update input out (item-level rows kept as saved). */
export function useAccountingForm({ settings, types }: UseAccountingFormInput) {
  const messages = useZodMessages();
  const schema = useMemo(() => {
    const kept = keptRevenueRows({ settings, types });
    return formSchema<AccountingFormValues, typeof AccountingSettingsUpdateInputSchema>({
      schema: AccountingSettingsUpdateInputSchema,
      toInput: ({ values }) => toUpdateInput({ values, kept }),
    });
  }, [settings, types]);
  return useForm<AccountingFormValues, unknown, Output>({
    resolver: zodResolver(schema, messages),
    defaultValues: toFormValues({ settings, types }),
  });
}
