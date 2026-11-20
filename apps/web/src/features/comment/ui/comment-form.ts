"use client";

import { type CommentCreateInput, CommentCreateInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";
import { zodMessageMap } from "@/lib/zod-error-map";

/** Raw values of the composer: `NONE` = the whole order. */
export type CommentFormValues = { body: string; lineId: string };

export type UseCommentFormInput = { orderId: string };

/** The composer's form, validated by core's create schema with localized messages. */
export function useCommentForm({ orderId }: UseCommentFormInput) {
  const t = useTranslations("errors");
  const schema = formSchema({
    schema: CommentCreateInputSchema,
    toInput: ({ values }: { values: CommentFormValues }) => ({
      orderId,
      body: values.body,
      lineId: values.lineId === NONE ? null : values.lineId,
    }),
  });
  return useForm<CommentFormValues, unknown, CommentCreateInput>({
    resolver: zodResolver(schema, { error: zodMessageMap({ translate: (key) => t(key) }) }),
    defaultValues: { body: "", lineId: NONE },
  });
}
