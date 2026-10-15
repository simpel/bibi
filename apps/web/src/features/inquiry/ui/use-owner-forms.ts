import { zodResolver } from "@hookform/resolvers/zod";
import type { InquiryDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { assignInquiryAction, qualifyInquiryAction } from "../actions";
import {
  type AssignOwnerFormOutput,
  assignOwnerFormSchema,
  type OwnerFormValues,
  ownerFormDefaults,
  type QualifyFormOutput,
  qualifyFormSchema,
} from "./owner-form-schema";

export type UseOwnerFormInput = { inquiry: InquiryDto; onDone: () => void };

/** `inquiry.qualify`: moves to QUALIFIED with the picked (or current) salesperson. */
export function useQualifyForm({ inquiry, onDone }: UseOwnerFormInput) {
  const t = useTranslations("inquiry");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<OwnerFormValues, unknown, QualifyFormOutput>({
    resolver: zodResolver(qualifyFormSchema({ id: inquiry.id }), useZodMessages()),
    defaultValues: ownerFormDefaults(inquiry),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => qualifyInquiryAction({ input: values }),
    messages: { pending: common("saving"), success: t("qualified") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}

/** `inquiry.assign`: a refused removal of the owner is shown on the field. */
export function useAssignOwnerForm({ inquiry, onDone }: UseOwnerFormInput) {
  const t = useTranslations("inquiry");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<OwnerFormValues, unknown, AssignOwnerFormOutput>({
    resolver: zodResolver(assignOwnerFormSchema({ id: inquiry.id }), useZodMessages()),
    defaultValues: ownerFormDefaults(inquiry),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => assignInquiryAction({ input: values }),
    messages: { pending: common("saving"), success: t("assigned") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("salesOwnerId", { message: t("ownerRequired") });
    },
  });
  return { form, submit, pending };
}
