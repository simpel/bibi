import { zodResolver } from "@hookform/resolvers/zod";
import type { BookingDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { assignBookingAction } from "../actions";
import {
  type AssignFormOutput,
  type AssignFormValues,
  assignFormDefaults,
  assignFormSchema,
} from "./assign-form-schema";

export type UseAssignFormInput = { booking: BookingDto; onDone: () => void };

/** Owners form state; a refused removal of the coordinator is shown on that field. */
export function useAssignForm({ booking, onDone }: UseAssignFormInput) {
  const t = useTranslations("booking");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<AssignFormValues, unknown, AssignFormOutput>({
    resolver: zodResolver(assignFormSchema({ id: booking.id }), useZodMessages()),
    defaultValues: assignFormDefaults(booking),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => assignBookingAction({ input: values }),
    messages: { pending: common("saving"), success: t("assigned") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") {
        form.setError("coordinatorId", { message: t("coordinatorRequired") });
      }
    },
  });
  return { form, submit, pending };
}
