import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { bookingSeriesRoute } from "@/lib/routes";
import { useFormAction } from "@/lib/use-form-action";
import { createBookingSeriesAction } from "../actions";
import type { SeriesFormData } from "./series-form-data";
import {
  type SeriesFormOutput,
  type SeriesFormValues,
  seriesFormDefaults,
  seriesFormSchema,
} from "./series-form-schema";

export type UseSeriesFormInput = { data: SeriesFormData; onDone: () => void };

/** Series form state; the new series opens its page, where clashing occurrences are listed. */
export function useSeriesForm({ data, onDone }: UseSeriesFormInput) {
  const t = useTranslations("bookingSeries");
  const common = useTranslations("common");
  const router = useRouter();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<SeriesFormValues, SeriesFormOutput>({
    types: data.types,
    schemaFor: ({ type }) => seriesFormSchema({ type, vocabularies: data.vocabularies }),
  });
  const form = useForm<SeriesFormValues, unknown, SeriesFormOutput>({
    resolver,
    defaultValues: seriesFormDefaults({ type: data.types[0] }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createBookingSeriesAction({ input: values }),
    messages: { pending: common("saving"), success: t("created") },
    onSuccess: ({ value }) => {
      onDone();
      router.push(bookingSeriesRoute({ id: value.id }));
    },
  });
  return { form, submit, pending, typeOf };
}
