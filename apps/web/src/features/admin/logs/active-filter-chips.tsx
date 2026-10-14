import type { SystemLogListQuery } from "@okazi/core/schemas";
import { Button } from "@okazi/ui";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLogNavigation } from "./use-log-navigation";

const CLEARED = { q: null, level: null, surface: null, requestId: null };

export type ActiveFilterChipsProps = { query: SystemLogListQuery };

/** The request-id chip (set from a row's detail) and "clear filters". */
export function ActiveFilterChips({ query }: ActiveFilterChipsProps) {
  const t = useTranslations("admin.logs.filters");
  const { navigate } = useLogNavigation();
  const active = Boolean(query.q || query.level || query.surface || query.requestId);
  return (
    <>
      {query.requestId ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ patch: { requestId: null } })}
        >
          {t("requestId")}: <span className="font-mono">{query.requestId.slice(0, 12)}</span>
          <XIcon />
        </Button>
      ) : null}
      {active ? (
        <Button variant="ghost" size="sm" onClick={() => navigate({ patch: CLEARED })}>
          {t("clear")}
        </Button>
      ) : null}
    </>
  );
}
