"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RelativeTime } from "@/components/relative-time";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type CommentCardViewProps = GenerativeProps<"comment-card">;

/** One comment: who wrote it and when, where it applies, the text and a link to its order. */
export function CommentCardView({ comment }: CommentCardViewProps) {
  const t = useTranslations("assistant.ui.comment");
  const names = useTranslations("comment");
  return (
    <Card data-slot="comment-card" className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{comment.authorName ?? names("formerMember")}</CardTitle>
        <Badge variant="secondary">{t("singular")}</Badge>
      </CardHeader>
      <CardContent className="grid gap-1 p-4 pt-0 text-sm">
        <p className="whitespace-pre-line">{comment.body}</p>
        <p className="text-muted-foreground">
          <RelativeTime instant={comment.createdAt} />
          {` · ${comment.lineId ? t("onLine") : t("onOrder")}`}
          {comment.status === "ARCHIVED" ? ` · ${t("archived")}` : null}
        </p>
        <Link href={orderRoute({ id: comment.orderId })} className="text-primary hover:underline">
          {t("openOrder")}
        </Link>
      </CardContent>
    </Card>
  );
}
