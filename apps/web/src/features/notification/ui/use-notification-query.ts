import { NOTIFICATION_KINDS } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { buildTableQuery } from "@/components/data-table/table-filter-query";
import { type NotificationKindLabels, splitNotificationQuery } from "../lib/notification-query";

/** The panel's search: its suggestions (`type:` and the kinds' names) and a splitter for its text. */
export function useNotificationQuery() {
  const t = useTranslations("notifications");
  return useMemo(() => {
    const labels = Object.fromEntries(
      NOTIFICATION_KINDS.map((kind) => [kind, t(`kinds.${kind}`)]),
    ) as NotificationKindLabels;
    const built = buildTableQuery({
      qualifiers: [
        {
          key: "kind",
          label: t("filter.kind"),
          options: NOTIFICATION_KINDS.map((kind) => labels[kind]),
          pick: () => null,
        },
      ],
    });
    const word = built.vocabulary.words.kind ?? "kind";
    return {
      ...built,
      split: ({ q }: { q: string }) => splitNotificationQuery({ q, labels, word }),
    };
  }, [t]);
}
