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
  ticketId: string;
  /** Where a new line starts by default. */
  startsAt: Date;
  /** Present = edit mode, absent = create mode. */
  line?: LineDto | undefined;
  onDone: () => void;
};

type SaveInput = {
  line: LineDto | undefined;
  values: LineFormOutput;
  type: EntityTypeDto | undefined;
};

/** Creates the line, or updates the one being edited. */
const save = ({ line, values, type }: SaveInput) =>
  line
    ? updateLineAction({ input: toLineUpdate({ line, values, type }) })
    : createLineAction({ input: values });

/** Line form state; the ticket page reloads with the changed run schedule. */
export function useLineForm({ data, ticketId, startsAt, line, onDone }: UseLineFormInput) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const router = useRouter();
  const typeOf = ({ id }: { id: string }) => data.types.find((type) => type.id === id);
  const resolver = useTypedResolver<LineFormValues, LineFormOutput>({
    types: data.types,
    schemaFor: ({ type }) =>
      lineFormSchema({ ticketId, type, vocabularies: data.vocabularies, zones: data, line }),
  });
  const initial = typeOf({ id: line?.entityTypeId ?? data.types[0]?.id ?? "" });
  const timeZone = lineTimeZone({ data, itemId: line?.itemId, line });
  const form = useForm<LineFormValues, unknown, LineFormOutput>({
    resolver,
    defaultValues: lineFormDefaults({ type: initial, line, startsAt, timeZone }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ line, values, type: typeOf({ id: values.entityTypeId }) }),
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
