"use client";

import { type CommentUpdateInput, CommentUpdateInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { updateCommentAction } from "../actions";
import { type Mentionable, mentionedIds } from "../lib/mentions";
import { MentionTextarea } from "./mention-textarea";

export type EditCommentFormProps = {
  id: string;
  body: string;
  /** Who can be mentioned, including those the comment mentions already. */
  people: readonly Mentionable[];
  onDone: () => void;
};

type Values = { body: string };

/** The author's comment as an inline form: Save writes the new text and mentions. */
export function EditCommentForm({ id, body, people, onDone }: EditCommentFormProps) {
  const t = useTranslations("comment");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const schema = formSchema({
    schema: CommentUpdateInputSchema,
    toInput: ({ values }: { values: Values }) => ({
      id,
      body: values.body,
      mentionUserIds: mentionedIds({ text: values.body, people }),
    }),
  });
  const form = useForm<Values, unknown, CommentUpdateInput>({
    resolver: zodResolver(schema, { error: zodMessageMap({ translate: (key) => errors(key) }) }),
    defaultValues: { body },
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
        <MentionTextarea form={form} name="body" label={t("edit")} people={people} />
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
