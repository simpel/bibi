import type { VocabularyValueDto } from "@bibi/core";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { addValueAction, renameValueAction } from "../actions";
import { type ValueFormValues, valueFormSchema } from "./value-form-schema";

export type ValueFormProps = {
  vocabularyId: string;
  /** Present = rename mode, absent = add mode. */
  value?: VocabularyValueDto | undefined;
  onDone: () => void;
};

/** Add (to `vocabularyId`) or rename one list value. */
export function ValueForm({ vocabularyId, value, onDone }: ValueFormProps) {
  const t = useTranslations("vocabulary.value");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<ValueFormValues, unknown, { name: string }>({
    resolver: zodResolver(valueFormSchema, useZodMessages()),
    defaultValues: { name: value?.name ?? "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      value
        ? renameValueAction({ id: value.id, name: values.name })
        : addValueAction({ vocabularyId, name: values.name }),
    messages: { pending: t("saving"), success: t(value ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("name")} required />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
