"use client";

import { type CommentCreateInput, CommentCreateInputSchema } from "@bibi/core/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";
import { zodMessageMap } from "@/lib/zod-error-map";
import { type Mentionable, mentionedIds } from "../lib/mentions";

/** Raw values of the composer: `NONE` = the whole order. */
export type CommentFormValues = { body: string; lineId: string };

export type UseCommentFormInput = {
  orderId: string;
  /** The line picked at first; `NONE` = the whole order. */
  lineId: string;
  /** Set for a reply: the comment it answers (its line is kept by core). */
  parentCommentId?: string | null | undefined;
  /** Who `@Name` in the text can mean; those found in the text are mentioned. */
  people: readonly Mentionable[];
};

/** The composer's form, validated by core's create schema with localized messages. */
export function useCommentForm({ orderId, lineId, parentCommentId, people }: UseCommentFormInput) {
  const t = useTranslations("errors");
  const schema = formSchema({
    schema: CommentCreateInputSchema,
    toInput: ({ values }: { values: CommentFormValues }) => ({
      orderId,
      body: values.body,
      lineId: values.lineId === NONE ? null : values.lineId,
      ...(parentCommentId ? { parentCommentId } : {}),
      mentionUserIds: mentionedIds({ text: values.body, people }),
    }),
  });
  return useForm<CommentFormValues, unknown, CommentCreateInput>({
    resolver: zodResolver(schema, { error: zodMessageMap({ translate: (key) => t(key) }) }),
    defaultValues: { body: "", lineId },
  });
}
