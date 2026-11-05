import { DepositRequestInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { minorOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { requestDepositAction } from "../actions";

/** Raw values; `amountMinor` is typed in kronor so server issues land on the field. */
export type RequestDepositFormValues = { amountMinor: string; description: string };
export type RequestDepositFormOutput = z.infer<typeof DepositRequestInputSchema>;

export type UseRequestDepositFormInput = {
  orderId: string;
  /** Kronor text prefilled from `deposit.suggest`; empty when there is no deposit rule. */
  defaultAmount: string;
  /** No rule to fall back on: the amount must be typed. */
  amountRequired: boolean;
};

/** Form state of "Request deposit": runs `deposit.request` and keeps the payment link it returns. */
export function useRequestDepositForm({
  orderId,
  defaultAmount,
  amountRequired,
}: UseRequestDepositFormInput) {
  const t = useTranslations("deposit");
  const common = useTranslations("common");
  const router = useRouter();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const schema = formSchema({
    schema: DepositRequestInputSchema,
    toInput: ({ values }: { values: RequestDepositFormValues }) => ({
      orderId,
      description: values.description,
      amountMinor: minorOrNull({ value: values.amountMinor }) ?? (amountRequired ? 0 : undefined),
    }),
  });
  const form = useForm<RequestDepositFormValues, unknown, RequestDepositFormOutput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: { amountMinor: defaultAmount, description: t("request.defaultDescription") },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => requestDepositAction({ input: values }),
    messages: { pending: common("sending"), success: t("request.created") },
    onSuccess: ({ value }) => {
      setPaymentUrl(value.paymentUrl);
      router.refresh();
    },
  });
  return { form, submit, pending, paymentUrl };
}
