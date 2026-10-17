import { zodResolver } from "@hookform/resolvers/zod";
import type { InquiryDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { qualifyInquiryAction } from "../actions";
import {
  type QualifyFormOutput,
  type QualifyFormValues,
  qualifyFormDefaults,
  qualifyFormSchema,
} from "./qualify-form-schema";

export type UseQualifyFormInput = { inquiry: InquiryDto; onDone: () => void };

/** `inquiry.qualify`: moves to QUALIFIED with the picked (or current) main assignee. */
export function useQualifyForm({ inquiry, onDone }: UseQualifyFormInput) {
  const t = useTranslations("inquiry");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<QualifyFormValues, unknown, QualifyFormOutput>({
    resolver: zodResolver(qualifyFormSchema({ id: inquiry.id }), useZodMessages()),
    defaultValues: qualifyFormDefaults(),
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
