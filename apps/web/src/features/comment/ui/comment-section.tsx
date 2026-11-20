import type { OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { COMMENTS_ANCHOR } from "../lib/comment-anchor";
import { loadOrderComments } from "../load-order-comments";
import { CommentThread } from "./comment-thread";
import { MarkCommentsSeen } from "./mark-comments-seen";

export type CommentSectionProps = { locale: Locale; order: OrderDto };

/**
 * Comments on the order and its lines (ADR 0115), oldest first, with a composer that comments
 * on the whole order or one line. Once the section is on screen, the caller's comment
 * notifications on the order count as read.
 */
export async function CommentSection({ locale, order }: CommentSectionProps) {
  const [t, state] = await Promise.all([getTranslations("comment"), loadOrderComments({ order })]);
  if (!state.ok && state.error.code === "FORBIDDEN") return null;
  if (!state.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: state.error, locale })} />;
  if (!state.value) return null;
  return (
    <section
      id={COMMENTS_ANCHOR}
      className="grid scroll-mt-24 grid-cols-1 gap-4"
      data-slot="comment-section"
    >
      <div className="grid gap-1">
        <h2 className="text-xl">{t("plural")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <CommentThread state={state.value} followHash />
      <MarkCommentsSeen ids={state.value.unread.map((item) => item.id)} />
    </section>
  );
}
