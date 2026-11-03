import { listNotifications } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ReadFilterTabs } from "@/components/activity/read-filter-tabs";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { notificationListInput } from "../lib/list-input";
import type { NotificationListParams } from "../lib/list-params";
import { MarkAllReadButton } from "./mark-all-read-button";
import { NotificationFilters } from "./notification-filters";
import { NotificationTable } from "./notification-table";

export type NotificationListProps = { locale: Locale; params: NotificationListParams };

/** Notifications page body (ADR 0094): header, read filters, search and kind, then the table. */
export async function NotificationList({ locale, params }: NotificationListProps) {
  const t = await getTranslations("notifications");
  const result = await runOperation({
    operation: listNotifications,
    input: notificationListInput({ params }),
  });
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
            <ReadFilterTabs
              pathname={ROUTES.notifications}
              read={params.read}
              keep={{
                ...(params.kind ? { kind: params.kind } : {}),
                ...(params.q ? { q: params.q } : {}),
              }}
            />
            <NotificationFilters q={params.q} kind={params.kind} />
          </div>
          <NotificationTable notifications={items} total={total ?? 0} view={params} />
        </>
      )}
    </div>
  );
}
