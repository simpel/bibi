import { TICKET_QUALIFIERS, type TicketQualifier } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { QueryTexts } from "../lib/query-suggestion-types";

const byKey = ({ text }: { text: (key: TicketQualifier) => string }) =>
  Object.fromEntries(TICKET_QUALIFIERS.map((key) => [key, text(key)])) as Record<
    TicketQualifier,
    string
  >;

/** The dropdown's labels, hints and special rows in the UI language. */
export function useQueryTexts(): QueryTexts {
  const t = useTranslations("ticket");
  return useMemo(
    () => ({
      labels: byKey({ text: (key) => t(`query.labels.${key}`) }),
      hints: byKey({ text: (key) => t(`qualifiers.${key}`) }),
      noAssignee: t("query.rows.noAssignee"),
      hasAssignee: t("query.rows.hasAssignee"),
      me: t("query.rows.me"),
      exclude: {
        assignee: t("query.rows.excludeAssignee"),
        follower: t("query.rows.excludeFollower"),
      },
    }),
    [t],
  );
}
