import { zodResolver } from "@hookform/resolvers/zod";
import type { BookingDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { changeBookingStatusAction } from "../actions";
import {
  type ChangeStatusFormOutput,
  type ChangeStatusFormValues,
  changeStatusFormSchema,
} from "./change-status-form-schema";

export type UseChangeStatusFormInput = { booking: BookingDto; onDone: () => void };

/** Change-status form state; a refused phase rule is shown on the status field. */
export function useChangeStatusForm({ booking, onDone }: UseChangeStatusFormInput) {
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<ChangeStatusFormValues, unknown, ChangeStatusFormOutput>({
    resolver: zodResolver(changeStatusFormSchema({ bookingId: booking.id }), useZodMessages()),
    defaultValues: { statusId: "", reason: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => changeBookingStatusAction({ input: values }),
    messages: { pending: common("saving"), success: t("statusChanged") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("statusId", { message: t("phaseRuleRefused") });
      if (error.issues.some(({ path }) => path === "reason")) {
        form.setError("reason", { message: t("reasonRequired") });
      }
    },
  });
  return { form, submit, pending };
}
