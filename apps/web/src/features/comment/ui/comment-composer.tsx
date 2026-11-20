"use client";

import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createCommentAction } from "../actions";
import { useCommentForm } from "./comment-form";
import type { CommentLineOption } from "./comment-view";

export type CommentComposerProps = { orderId: string; lines: readonly CommentLineOption[] };

/** Writes a comment on the whole order or one of its lines; the page then reloads with it. */
export function CommentComposer({ orderId, lines }: CommentComposerProps) {
  const t = useTranslations("comment");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useCommentForm({ orderId });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createCommentAction({ input: values }),
    messages: { pending: common("saving"), success: t("added") },
    onSuccess: () => {
      form.reset({ body: "", lineId: form.getValues("lineId") });
      router.refresh();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} className="grid gap-3" data-slot="comment-composer">
        <TextField
          form={form}
          name="body"
          label={t("body")}
          placeholder={t("placeholder")}
          multiline
        />
        <div className="flex flex-wrap items-end justify-between gap-3">
          {lines.length > 0 ? (
            <div className="min-w-56">
              <OptionSelectField
                control={form.control}
                name="lineId"
                label={t("about")}
                options={lines}
                noneLabel={t("wholeOrder")}
              />
            </div>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={pending}>
            {t("add")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
