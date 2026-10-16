import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { createOptionAction } from "../actions";
import {
  OPTION_FORM_DEFAULTS,
  type OptionFormOutput,
  type OptionFormValues,
  optionFormSchema,
} from "./option-form-schema";

export type UseOptionFormInput = { itemId: string; onDone: () => void };

/** Option form state; server field errors (period, expiry) land on their fields. */
export function useOptionForm({ itemId, onDone }: UseOptionFormInput) {
  const t = useTranslations("option");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const form = useForm<OptionFormValues, unknown, OptionFormOutput>({
    resolver: zodResolver(optionFormSchema({ itemId }), {
      error: zodMessageMap({ translate: (key) => errors(key) }),
    }),
    defaultValues: OPTION_FORM_DEFAULTS,
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createOptionAction({ input: values }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}
