import type { LineChooseOptionsInput } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { chooseLineOptionsAction } from "../actions";
import {
  type ChooseOptionsDefaultsInput,
  type ChooseOptionsFormValues,
  chooseOptionsDefaults,
  chooseOptionsSchema,
} from "./choose-options-schema";

export type UseChooseOptionsFormInput = ChooseOptionsDefaultsInput & {
  lineId: string;
  onDone: () => void;
};

/** The form state of `line.chooseOptions`; the ticket page reloads with the option lines. */
export function useChooseOptionsForm({ lineId, onDone, ...defaults }: UseChooseOptionsFormInput) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const router = useRouter();
  const schema = useMemo(() => chooseOptionsSchema({ lineId }), [lineId]);
  const form = useForm<ChooseOptionsFormValues, unknown, LineChooseOptionsInput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: chooseOptionsDefaults(defaults),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => chooseLineOptionsAction({ input: values }),
    messages: { pending: common("saving"), success: t("optionsChosen") },
    onSuccess: () => {
      onDone();
      router.refresh();
    },
  });
  return { form, submit, pending };
}
