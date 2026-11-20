"use client";

import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { NONE, OptionSelectField } from "@/components/form/option-select-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createCommentAction } from "../actions";
import { COMMENTS_ANCHOR, lineOfHash } from "../lib/comment-anchor";
import type { Mentionable } from "../lib/mentions";
import { useCommentForm } from "./comment-form";
import type { CommentLineOption } from "./comment-view";
import { MentionTextarea } from "./mention-textarea";

export type CommentComposerProps = {
  orderId: string;
  lines: readonly CommentLineOption[];
  /** Comments go on this line (null = the whole order) and the About picker is hidden. */
  fixedLineId?: string | null | undefined;
  /** A `#comment-<lineId>` hash picks that line, scrolls here and focuses the text box. */
  followHash?: boolean;
  /** Who can be mentioned with @. */
  people: readonly Mentionable[];
  /** A reply: the comment it answers; its line is kept and no picker shows. */
  parentCommentId?: string | undefined;
  /** After a reply is saved, e.g. to close the reply box. */
  onDone?: (() => void) | undefined;
};

/** Writes a comment on the whole order or one of its lines; the page then reloads with it. */
export function CommentComposer({
  orderId,
  lines,
  fixedLineId,
  followHash,
  people,
  parentCommentId,
  onDone,
}: CommentComposerProps) {
  const t = useTranslations("comment");
  const common = useTranslations("common");
  const router = useRouter();
  const root = useRef<HTMLFormElement>(null);
  const initial = fixedLineId === undefined ? NONE : (fixedLineId ?? NONE);
  const form = useCommentForm({ orderId, lineId: initial, parentCommentId, people });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createCommentAction({ input: values }),
    messages: { pending: common("saving"), success: t(parentCommentId ? "replied" : "added") },
    onSuccess: () => {
      form.reset({ body: "", lineId: form.getValues("lineId") });
      onDone?.();
      router.refresh();
    },
  });
  // Syncs with the browser's location hash: links from My work and the timeline land here.
  useEffect(() => {
    if (!followHash) return;
    const follow = () => {
      const lineId = lineOfHash({ hash: window.location.hash });
      if (lineId && lines.some((line) => line.id === lineId)) form.setValue("lineId", lineId);
      if (lineId || window.location.hash === `#${COMMENTS_ANCHOR}`) {
        root.current?.scrollIntoView({ block: "center" });
        form.setFocus("body");
      }
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, [followHash, lines, form]);
  return (
    <Form {...form}>
      <form ref={root} onSubmit={submit} className="grid gap-3" data-slot="comment-composer">
        <MentionTextarea
          form={form}
          name="body"
          label={parentCommentId ? t("reply") : t("body")}
          placeholder={t("placeholder")}
          people={people}
        />
        <div className="flex flex-wrap items-end justify-between gap-3">
          {fixedLineId === undefined && !parentCommentId && lines.length > 0 ? (
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
          <div className="flex gap-2">
            {onDone ? (
              <Button type="button" variant="ghost" onClick={onDone}>
                {common("cancel")}
              </Button>
            ) : null}
            <Button type="submit" disabled={pending}>
              {parentCommentId ? t("reply") : t("add")}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
