import { zodResolver } from "@hookform/resolvers/zod";
import type { QuoteDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { quoteRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createQuoteAction, updateQuoteAction } from "../actions";
import {
  type QuoteFormOutput,
  type QuoteFormTarget,
  type QuoteFormValues,
  quoteFormDefaults,
  quoteFormSchema,
} from "./quote-form-schema";

export type UseQuoteFormInput = { target: QuoteFormTarget; quote?: QuoteDto; onDone: () => void };

/** `quote.create` (then opens the quote) or `quote.update` of a draft's validity and terms. */
export function useQuoteForm({ target, quote, onDone }: UseQuoteFormInput) {
  const t = useTranslations("quote");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<QuoteFormValues, unknown, QuoteFormOutput>({
    resolver: zodResolver(quoteFormSchema({ target }), useZodMessages()),
    defaultValues: quoteFormDefaults({ quote }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      "id" in values ? updateQuoteAction({ input: values }) : createQuoteAction({ input: values }),
    messages: { pending: common("saving"), success: quote ? t("saved") : t("created") },
    onSuccess: ({ value }) => {
      onDone();
      if (quote) router.refresh();
      else router.push(quoteRoute({ id: value.id }));
    },
  });
  return { form, submit, pending };
}
