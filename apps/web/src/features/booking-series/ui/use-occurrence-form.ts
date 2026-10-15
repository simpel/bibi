import { zodResolver } from "@hookform/resolvers/zod";
import type { SeriesOccurrenceDto } from "@okazi/core";
import { useRouter } from "@okazi/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { updateOccurrencesAction } from "../actions";
import {
  type OccurrenceFormOutput,
  type OccurrenceFormValues,
  occurrenceFormDefaults,
  occurrenceFormSchema,
} from "./occurrence-form-schema";

export type UseOccurrenceFormInput = {
  seriesId: string;
  occurrence: SeriesOccurrenceDto;
  onDone: () => void;
};

/** Occurrence form state; taken items (CONFLICT) are shown on the room field. */
export function useOccurrenceForm({ seriesId, occurrence, onDone }: UseOccurrenceFormInput) {
  const t = useTranslations("bookingSeries");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<OccurrenceFormValues, unknown, OccurrenceFormOutput>({
    resolver: zodResolver(occurrenceFormSchema({ seriesId, occurrence }), useZodMessages()),
    defaultValues: occurrenceFormDefaults({ occurrence }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateOccurrencesAction({ input: values }),
    messages: { pending: common("saving"), success: t("occurrencesUpdated") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("patch.itemId", { message: t("itemsTaken") });
    },
  });
  return { form, submit, pending };
}
