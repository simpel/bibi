import { zodResolver } from "@hookform/resolvers/zod";
import { BookingSeriesCancelInputSchema } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { cancelBookingSeriesAction } from "../actions";

type CancelSeriesFormValues = { reason: string };
type CancelSeriesFormOutput = z.infer<typeof BookingSeriesCancelInputSchema>;

/** Core's `bookingSeries.cancel` schema for one series; the CANCELLED phase's default status. */
const cancelSeriesFormSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: BookingSeriesCancelInputSchema,
    toInput: ({ values }: { values: CancelSeriesFormValues }) => ({ id, reason: values.reason }),
  });

export type UseCancelSeriesFormInput = { id: string; onDone: () => void };

/** Cancel-series form state: the reason every upcoming occurrence is cancelled with. */
export function useCancelSeriesForm({ id, onDone }: UseCancelSeriesFormInput) {
  const t = useTranslations("bookingSeries");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<CancelSeriesFormValues, unknown, CancelSeriesFormOutput>({
    resolver: zodResolver(cancelSeriesFormSchema({ id }), useZodMessages()),
    defaultValues: { reason: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => cancelBookingSeriesAction({ input: values }),
    messages: { pending: common("saving"), success: t("cancelled") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}
