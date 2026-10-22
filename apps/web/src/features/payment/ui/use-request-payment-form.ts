import type { PaymentMethod } from "@bibi/core/schemas";
import { PaymentCreateInputSchema } from "@bibi/core/schemas";
import { useRouter } from "@bibi/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { blankToUndefined, minorOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createPaymentAction } from "../actions";

export type RequestPaymentFormValues = {
  method: PaymentMethod;
  amount: string;
  description: string;
};
export type RequestPaymentFormOutput = z.infer<typeof PaymentCreateInputSchema>;

/** The one receivable the payment settles (ADR 0057). */
export type ReceivableTarget = { quoteId: string } | { depositId: string } | { invoiceId: string };

/**
 * Core's `payment.create` schema; the amount is typed in kronor and sent in öre. Empty means the
 * receivable's open balance.
 */
const requestPaymentFormSchema = ({ target }: { target: ReceivableTarget }) =>
  formSchema({
    schema: PaymentCreateInputSchema,
    toInput: ({ values }: { values: RequestPaymentFormValues }) => ({
      ...target,
      method: values.method,
      amountMinor: minorOrNull({ value: values.amount }) ?? undefined,
      description: blankToUndefined({ value: values.description }),
    }),
  });

export type UseRequestPaymentFormInput = { target: ReceivableTarget; onDone: () => void };

/** Request-payment form state: method, amount (open balance by default) and the text. */
export function useRequestPaymentForm({ target, onDone }: UseRequestPaymentFormInput) {
  const t = useTranslations("payment");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<RequestPaymentFormValues, unknown, RequestPaymentFormOutput>({
    resolver: zodResolver(requestPaymentFormSchema({ target }), useZodMessages()),
    defaultValues: { method: "CARD", amount: "", description: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createPaymentAction({ input: values }),
    messages: { pending: common("sending"), success: t("created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}
