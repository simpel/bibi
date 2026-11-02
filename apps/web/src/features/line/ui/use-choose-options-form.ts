import type { LineChooseOptionsInput } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { chooseOptionsWithExtrasAction } from "../extra-actions";
import {
  type ChooseOptionsSchemaInput,
  chooseOptionsSchema,
  type ExtraAddOn,
  extraChanges,
  withExtras,
} from "./choose-options-extras";
import {
  type ChooseOptionsDefaultsInput,
  type ChooseOptionsFormValues,
  chooseOptionsDefaults,
} from "./choose-options-schema";
import { splitPicks } from "./split-picks";
import { usePickRuleText } from "./use-pick-rule-text";

export type UseChooseOptionsFormInput = ChooseOptionsDefaultsInput & {
  lineId: string;
  ticketId: string;
  /** The line's add-ons that are extra picks of its groups (ADR 0088). */
  extras: readonly ExtraAddOn[];
  onDone: () => void;
};

type SaveInput = Pick<ChooseOptionsSchemaInput, "item"> & {
  input: LineChooseOptionsInput;
  raw: ChooseOptionsFormValues;
  ticketId: string;
  extras: readonly ExtraAddOn[];
};

/** The options, then the extra picks as add-ons and unpicked extras archived. */
const save = ({ input, raw, item, ticketId, extras }: SaveInput) => {
  const picks = splitPicks({ groups: item.groups, picked: raw.groups }).extras;
  const changes = extraChanges({ existing: extras, picks });
  return chooseOptionsWithExtrasAction({ input, ticketId, ...changes });
};

/** The form state of `line.chooseOptions`; the ticket page reloads with the option lines. */
export function useChooseOptionsForm({
  lineId,
  ticketId,
  extras,
  onDone,
  ...defaults
}: UseChooseOptionsFormInput) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const router = useRouter();
  const { item } = defaults;
  const ruleText = usePickRuleText();
  const schema = useMemo(
    () => chooseOptionsSchema({ lineId, item, ruleText }),
    [lineId, item, ruleText],
  );
  const form = useForm<ChooseOptionsFormValues, unknown, LineChooseOptionsInput>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: withExtras({ item, values: chooseOptionsDefaults(defaults), extras }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ input: values, raw: form.getValues(), item, ticketId, extras }),
    messages: { pending: common("saving"), success: t("optionsChosen") },
    onSuccess: () => {
      onDone();
      router.refresh();
    },
  });
  return { form, submit, pending };
}
