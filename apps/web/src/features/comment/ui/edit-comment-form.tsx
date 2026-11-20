"use client";

import { type CommentUpdateInput, CommentUpdateInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { updateCommentAction } from "../actions";

export type EditCommentFormProps = { id: string; body: string; onDone: () => void };

/** The author's comment as an inline form: Save writes the new text, Cancel keeps the old. */
export function EditCommentForm({ id, body, onDone }: EditCommentFormProps) {
  const t = useTranslations("comment");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const form = useForm<CommentUpdateInput>({
    resolver: zodResolver(CommentUpdateInputSchema, {
      error: zodMessageMap({ translate: (key) => errors(key) }),
    }),
    defaultValues: { id, body },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateCommentAction({ input: values }),
    messages: { pending: common("saving"), success: t("updated") },
    onSuccess: () => {
      onDone();
      router.refresh();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} className="grid gap-2">
        <TextField form={form} name="body" label={t("edit")} multiline />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
