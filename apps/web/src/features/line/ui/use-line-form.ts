import type { EntityTypeDto, LineDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useTypedResolver } from "@/components/typed-fields/use-typed-resolver";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createLineAction, updateLineAction } from "../actions";
import { type LineFormOutput, lineFormSchema, toLineUpdate } from "./line-form-schema";
import { type LineFormValues, lineFormDefaults } from "./line-form-values";
import { lineTimeZone } from "./line-time-zone";
import type { ProgramFormData } from "./program-form-data";

export type UseLineFormInput = {
  data: ProgramFormData;
  orderId: string;
  /** Where a new line starts by default. */
  startsAt: Date;
  /** Present = edit mode, absent = create mode. */
  line?: LineDto | undefined;
  /** Create mode: the top-level line the new line is an add-on of (ADR 0088). */
  parent?: LineDto | undefined;
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

/** Line form state; the order page reloads with the changed run schedule. */
export function useLineForm({ data, orderId, startsAt, line, parent, onDone }: UseLineFormInput) {
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
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      save({ line, parent, values, type: typeOf({ id: values.entityTypeId }) }),
    messages: { pending: common("saving"), success: t(line ? "updated" : "created") },
    onSuccess: () => {
      onDone();
      router.refresh();
    },
    onError: ({ error }) => {
      if (error.code === "CONFLICT") form.setError("itemId", { message: t("occupied") });
    },
  });
  return { form, submit, pending, typeOf };
}
