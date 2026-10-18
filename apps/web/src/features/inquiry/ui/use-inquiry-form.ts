import type { InquiryDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { inquiryRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { createInquiryAction, updateInquiryAction } from "../actions";
import type { InquiryFormData } from "./inquiry-form-data";
import { type InquiryFormOutput, inquiryFormSchema, toInquiryUpdate } from "./inquiry-form-schema";
import { type InquiryFormValues, inquiryFormDefaults } from "./inquiry-form-values";

export type UseInquiryFormInput = {
  data: InquiryFormData;
  /** Present = edit mode, absent = create mode. */
  inquiry?: InquiryDto | undefined;
  onDone: () => void;
};

/** Inquiry form state; a new inquiry opens its page, an edit refreshes it. */
export function useInquiryForm({ data, inquiry, onDone }: UseInquiryFormInput) {
  const t = useTranslations("inquiry");
  const common = useTranslations("common");
  const router = useRouter();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<InquiryFormValues, InquiryFormOutput>({
    types: data.types,
    schemaFor: ({ type }) => inquiryFormSchema({ type, vocabularies: data.vocabularies }),
  });
  const initial = typeOf({ id: inquiry?.entityTypeId ?? data.types[0]?.id ?? "" });
  const form = useForm<InquiryFormValues, unknown, InquiryFormOutput>({
    resolver,
    defaultValues: inquiryFormDefaults({ type: initial, inquiry }),
  });
  const { submit, run, pending } = useFormAction({
    form,
    action: ({ values }) =>
      inquiry
        ? updateInquiryAction({
            input: toInquiryUpdate({ inquiry, values, type: typeOf({ id: inquiry.entityTypeId }) }),
          })
        : createInquiryAction({ input: values }),
    messages: { pending: common("saving"), success: t(inquiry ? "updated" : "created") },
    onSuccess: ({ value }) => {
      onDone();
      if (inquiry) router.refresh();
      else router.push(inquiryRoute({ id: value.id }));
    },
  });
  return { form, submit, run, pending, typeOf };
}
