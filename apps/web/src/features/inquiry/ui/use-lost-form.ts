import { zodResolver } from "@hookform/resolvers/zod";
import type { InquiryDto } from "@okazi/core";
import { InquiryMarkLostInputSchema } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { formSchema } from "@/lib/form-schema";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { markInquiryLostAction } from "../actions";

export type LostFormValues = { lossReason: string };
type LostFormOutput = z.infer<typeof InquiryMarkLostInputSchema>;

const lostFormSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: InquiryMarkLostInputSchema,
    toInput: ({ values }: { values: LostFormValues }) => ({ id, lossReason: values.lossReason }),
  });

export type UseLostFormInput = { inquiry: InquiryDto; onDone: () => void };

/** `inquiry.markLost`: the reason is required. */
export function useLostForm({ inquiry, onDone }: UseLostFormInput) {
  const t = useTranslations("inquiry");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<LostFormValues, unknown, LostFormOutput>({
    resolver: zodResolver(lostFormSchema({ id: inquiry.id }), useZodMessages()),
    defaultValues: { lossReason: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => markInquiryLostAction({ input: values }),
    messages: { pending: common("saving"), success: t("markedLost") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}
