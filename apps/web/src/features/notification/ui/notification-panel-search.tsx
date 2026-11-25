import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { QueryInput } from "@/components/query-search/query-input";
import type { useNotificationQuery } from "./use-notification-query";

export type NotificationPanelSearchProps = {
  value: string;
  onChange: (value: string) => void;
  query: ReturnType<typeof useNotificationQuery>;
};

/**
 * The panel's search: free text plus a `type:` filter, with suggestions while typing. It narrows
 * as you type, so there is no submit.
 */
export function NotificationPanelSearch({ value, onChange, query }: NotificationPanelSearchProps) {
  const t = useTranslations("notifications");
  return (
    <div className="relative shrink-0 border-b p-3">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-5.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <QueryInput
        name="q"
        ref={() => {}}
        value={value}
        onChange={onChange}
        onBlur={() => {}}
        placeholder={t("panel.search")}
        aria-label={t("panel.search")}
        className="pl-8"
        catalog={query.catalog}
        vocabulary={query.vocabulary}
        texts={query.texts}
      />
    </div>
  );
}
