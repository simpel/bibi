import { listComments, type OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { loadOrderLines } from "@/features/line/load-order-lines";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CommentThread } from "./comment-thread";
import type { CommentView } from "./comment-view";

export type CommentSectionProps = { locale: Locale; order: OrderDto };

/**
 * Comments on the order and its lines (ADR 0115), oldest first, with a composer that comments
 * on the whole order or one line. Line names need `program:read`; without it every comment
 * shows without its line.
 */
export async function CommentSection({ locale, order }: CommentSectionProps) {
  const [t, abilities, comments] = await Promise.all([
    getTranslations("comment"),
    getCallerAbilities(),
    runOperation({ operation: listComments, input: { orderId: order.id, limit: 100 } }),
  ]);
  if (!comments.ok && comments.error.code === "FORBIDDEN") return null;
  if (!comments.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: comments.error, locale })} />;
  const lines = can({ abilities, permission: "program:read" })
    ? await loadOrderLines({ orderId: order.id })
    : null;
  const options = lines?.ok ? lines.value.items.map(({ id, name }) => ({ id, name })) : [];
  const nameOf = new Map(options.map((line) => [line.id, line.name]));
  const canRemoveAny = can({ abilities, permission: "comment:delete" });
  const views: CommentView[] = comments.value.items.map((comment) => {
    const own = comment.createdBy !== null && comment.createdBy === abilities.userId;
    return {
      id: comment.id,
      body: comment.body,
      lineName: comment.lineId ? (nameOf.get(comment.lineId) ?? null) : null,
      authorName: comment.authorName,
      createdAt: comment.createdAt.toISOString(),
      edited: comment.editedAt !== null,
      canEdit: own,
      canDelete: own || canRemoveAny,
    };
  });
  return (
    <section className="grid grid-cols-1 gap-4" data-slot="comment-section">
      <div className="grid gap-1">
        <h2 className="text-xl">{t("plural")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <CommentThread
        orderId={order.id}
        comments={views}
        lines={options}
        canWrite={can({ abilities, permission: "comment:write" })}
      />
    </section>
  );
}
