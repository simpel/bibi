import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/states/page-header";
import type { NotificationPageParams } from "../lib/list-params";
import { MarkAllReadButton } from "./mark-all-read-button";
import { NotificationFilters } from "./notification-filters";
import { NotificationSection } from "./notification-section";

export type NotificationListProps = { locale: Locale; params: NotificationPageParams };

/**
 * Notifications page body (ADR 0094): header, search and kind, then the unread notifications
 * and, below them, the read ones. Each table pages on its own.
 */
export async function NotificationList({ locale, params }: NotificationListProps) {
  const t = await getTranslations("notifications");
  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={<MarkAllReadButton />}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <NotificationFilters q={params.unread.q} kind={params.unread.kind} />
      </div>
      <NotificationSection locale={locale} title={t("unread")} params={params.unread} />
      <NotificationSection locale={locale} title={t("read")} params={params.read} />
    </div>
  );
}
