import type { EntityTypeDto, LineDto } from "@bibi/core";
import type { LineChooseOptionsInput } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { chooseLineOptionsAction, createLineAction, updateLineAction } from "../actions";
import { type LineFormOutput, lineFormSchema, toLineUpdate } from "./line-form-schema";
import { type LineFormValues, lineFormDefaults } from "./line-form-values";
import { lineTimeZone } from "./line-time-zone";
import type { ProgramFormData } from "./program-form-data";
import { useHoursConfirm } from "./use-hours-confirm";
import { type LineChoices, useLineChoices } from "./use-line-choices";

export type UseLineFormInput = {
  data: ProgramFormData;
  orderId: string;
  /** Where a new line starts by default. */
  startsAt: Date;
  /** Present = edit mode, absent = create mode. */
  line?: LineDto | undefined;
  /** Create mode: the top-level line the new line is an add-on of (ADR 0088). */
  parent?: LineDto | undefined;
  /** Edit mode, an item with customisation groups: its choices are edited and saved here too. */
  choices?: LineChoices | undefined;
  onDone: () => void;
};

type SaveInput = {
  line: LineDto | undefined;
  parent: LineDto | undefined;
  values: LineFormOutput;
  type: EntityTypeDto | undefined;
};

/** Creates the line (an add-on under `parent` when given), or updates the one being edited. */
const save = ({ line, parent, values, type }: SaveInput) =>
  line
    ? updateLineAction({ input: toLineUpdate({ line, values, type }) })
    : createLineAction({ input: { ...values, ...(parent ? { parentLineId: parent.id } : {}) } });

type SaveWithChoicesInput = SaveInput & { options: LineChooseOptionsInput | null };

/** Saves the line, then its changed choices; the first error stops it and is the result. */
async function saveWithChoices({ options, ...input }: SaveWithChoicesInput) {
  const saved = await save(input);
  if (!saved.ok || options === null) return saved;
  const chosen = await chooseLineOptionsAction({ input: options });
  return chosen.ok ? saved : { ok: false as const, error: chosen.error };
}

/** Line form state; the order page reloads with the changed run schedule. */
export function useLineForm({
  data,
  orderId,
  startsAt,
  line,
  parent,
  choices,
  onDone,
}: UseLineFormInput) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const router = useRouter();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<LineFormValues, LineFormOutput>({
    types: data.types,
    schemaFor: ({ type }) =>
      lineFormSchema({ orderId, type, vocabularies: data.vocabularies, zones: data, line }),
  });
  // An add-on starts as its parent's type and period (ADR 0088 decision 11); both can change.
  const initial = typeOf({
    id: line?.entityTypeId ?? parent?.entityTypeId ?? data.types[0]?.id ?? "",
  });
  const timeZone = lineTimeZone({ data, itemId: line?.itemId, line: line ?? parent });
  const form = useForm<LineFormValues, unknown, LineFormOutput>({
    resolver,
    defaultValues: lineFormDefaults({ type: initial, line, parent, startsAt, timeZone }),
  });
  const hours = useHoursConfirm({ line });
  // Choices only while the line keeps the item they belong to.
  const kept = choices && form.watch("itemId") === choices.item.itemId ? choices : undefined;
  const lineChoices = useLineChoices({ lineId: line?.id ?? "", choices: kept });
  const options = useRef<LineChooseOptionsInput | null>(null);
  const { run, pending } = useFormAction({
    form,
    action: ({ values }) =>
      saveWithChoices({
        ...{ line, parent, values, options: options.current },
        type: typeOf({ id: values.entityTypeId }),
      }),
    messages: { pending: common("saving"), success: t(line ? "updated" : "created") },
    onSuccess: () => {
      onDone();
      router.refresh();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("itemId", { message: t("occupied") });
    },
  });
  // Outside the hours that apply, the save waits for the user's yes in a dialog.
  const submit = form.handleSubmit(async (values) => {
    const chosen = await lineChoices.resolve();
    if (!chosen.ok) return;
    options.current = chosen.input;
    if (await hours.check({ values })) run({ values });
  });
  const confirmOutsideHours = () => {
    if (!hours.waiting) return;
    run({ values: hours.waiting.values });
    hours.cancel();
  };
  return {
    ...{ form, submit, pending, typeOf, hours, confirmOutsideHours },
    choices: kept ? lineChoices : undefined,
  };
}
