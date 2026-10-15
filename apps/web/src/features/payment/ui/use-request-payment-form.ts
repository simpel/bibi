import { zodResolver } from "@hookform/resolvers/zod";
import type { PaymentMethod } from "@okazi/core/schemas";
import { PaymentCreateInputSchema } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { blankToUndefined, numberOrNull } from "@/lib/blank";
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

/** Core's `payment.create` schema; the amount is typed in kronor and sent in öre. */
const requestPaymentFormSchema = ({ bookingId }: { bookingId: string }) =>
  formSchema({
    schema: PaymentCreateInputSchema,
    toInput: ({ values }: { values: RequestPaymentFormValues }) => {
      const kr = numberOrNull({ value: values.amount });
      return {
        bookingId,
        method: values.method,
        amountMinor: kr === null ? undefined : Math.round(kr * 100),
        description: blankToUndefined({ value: values.description }),
      };
    },
  });

export type UseRequestPaymentFormInput = { bookingId: string; onDone: () => void };

/** Request-payment form state: method, amount and the text the customer sees. */
export function useRequestPaymentForm({ bookingId, onDone }: UseRequestPaymentFormInput) {
  const t = useTranslations("payment");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<RequestPaymentFormValues, unknown, RequestPaymentFormOutput>({
    resolver: zodResolver(requestPaymentFormSchema({ bookingId }), useZodMessages()),
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
