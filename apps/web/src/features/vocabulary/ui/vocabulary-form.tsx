import type { VocabularyCreateInput, VocabularyDto } from "@bibi/core";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { createVocabularyAction, renameVocabularyAction } from "../actions";
import {
  type VocabularyFormValues,
  vocabularyFormDefaults,
  vocabularyFormSchema,
} from "./vocabulary-form-schema";

export type VocabularyFormProps = { vocabulary?: VocabularyDto | undefined; onDone: () => void };

type SaveInput = { vocabulary: VocabularyDto | undefined; values: VocabularyCreateInput };

const save = ({ vocabulary, values }: SaveInput) =>
  vocabulary
    ? renameVocabularyAction({ id: vocabulary.id, name: values.name })
    : createVocabularyAction({ input: values });

/** Create (name + initial values, one per line) or rename a list. */
export function VocabularyForm({ vocabulary, onDone }: VocabularyFormProps) {
  const t = useTranslations("vocabulary");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<VocabularyFormValues, unknown, VocabularyCreateInput>({
    resolver: zodResolver(vocabularyFormSchema, useZodMessages()),
    defaultValues: vocabularyFormDefaults({ vocabulary }),
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ vocabulary, values }),
    messages: { pending: t("saving"), success: t(vocabulary ? "updated" : "created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        {vocabulary ? null : (
          <TextField form={form} name="values" label={t("fields.values")} multiline rows={6} />
        )}
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
