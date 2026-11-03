import { listNotifications } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { NotificationListParams } from "../lib/list-params";
import { MarkAllReadButton } from "./mark-all-read-button";
import { NotificationFilters } from "./notification-filters";
import { NotificationReadFilters } from "./notification-read-filters";
import { NotificationTable } from "./notification-table";

export type NotificationListProps = { locale: Locale; params: NotificationListParams };

/** `notification.list` by page number, so the server returns the total for the page count. */
const listInput = ({ params }: { params: NotificationListParams }) => ({
  page: params.page,
  limit: params.pageSize,
  sort: params.sort,
  direction: params.direction,
  ...(params.q ? { q: params.q } : {}),
  ...(params.kind ? { kind: params.kind } : {}),
  ...(params.read ? { read: params.read } : {}),
});

/** Notifications page body (ADR 0094): header, read filters, search and kind, then the table. */
export async function NotificationList({ locale, params }: NotificationListProps) {
  const t = await getTranslations("notifications");
  const result = await runOperation({ operation: listNotifications, input: listInput({ params }) });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const { items, total } = result.value;
  const filtered = Boolean(params.q || params.kind || params.read);
  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<MarkAllReadButton />}
      />
      {total === 0 && !filtered ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <NotificationReadFilters read={params.read} kind={params.kind} q={params.q} />
            <NotificationFilters q={params.q} kind={params.kind} />
          </div>
          <NotificationTable notifications={items} total={total ?? 0} view={params} />
        </>
      )}
    </div>
  );
}
