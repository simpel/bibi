import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { bookingRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createQuickBookingAction } from "../actions";
import type { QuickBookingData } from "./quick-booking-data";
import {
  type QuickBookingFormOutput,
  type QuickBookingFormValues,
  quickBookingFormSchema,
} from "./quick-booking-form-schema";

export type UseQuickBookingFormInput = { data: QuickBookingData; onDone: () => void };

/** Quick booking form state; the new booking opens its page. */
export function useQuickBookingForm({ data, onDone }: UseQuickBookingFormInput) {
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<QuickBookingFormValues, unknown, QuickBookingFormOutput>({
    resolver: zodResolver(quickBookingFormSchema(), useZodMessages()),
    defaultValues: {
      entityTypeId: data.bookingTypes[0]?.id ?? "",
      programItemTypeId: data.programItemTypes[0]?.id ?? "",
      customerId: "",
      itemId: "",
      startsAt: "",
      endsAt: "",
      quantity: "",
      paymentMethod: "INVOICE",
    },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createQuickBookingAction({ input: values }),
    messages: { pending: common("saving"), success: t("quickCreated") },
    onSuccess: ({ value }) => {
      onDone();
      router.push(bookingRoute({ id: value.id }));
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("itemId", { message: t("quickOccupied") });
    },
  });
  return { form, submit, pending };
}
