import type { FieldDefinitionDto } from "@bibi/core";
import { useRouter } from "@bibi/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createFieldAction, updateFieldAction } from "../actions";
import {
  type FieldFormOutput,
  type FieldFormValues,
  fieldFormDefaults,
  fieldFormSchema,
} from "./field-form-schema";

export type UseFieldFormInput = {
  entityTypeId: string;
  /** Present = edit mode, absent = create mode. */
  field?: FieldDefinitionDto | undefined;
  onDone: () => void;
};

type SaveInput = { field: FieldDefinitionDto | undefined; values: FieldFormOutput };

const save = ({ field, values }: SaveInput) =>
  field
    ? updateFieldAction({
        input: {
          id: field.id,
          name: values.name,
          kind: values.kind,
          required: values.required ?? false,
          vocabularyId: values.vocabularyId ?? null,
          options: values.options ?? [],
          linkTypeId: values.linkTypeId ?? null,
        },
      })
    : createFieldAction({ input: values });

/** Field form state: core's field schema, one toast per save (CLAUDE.md "Forms"). */
export function useFieldForm({ entityTypeId, field, onDone }: UseFieldFormInput) {
  const t = useTranslations("fieldDefinition");
  const router = useRouter();
  const form = useForm<FieldFormValues, unknown, FieldFormOutput>({
    resolver: zodResolver(fieldFormSchema, useZodMessages()),
    defaultValues: fieldFormDefaults({ entityTypeId, field }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ field, values }),
    messages: { pending: t("saving"), success: t(field ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return { form, submit, pending };
}
