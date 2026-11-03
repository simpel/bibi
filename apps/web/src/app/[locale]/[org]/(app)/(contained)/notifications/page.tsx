import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import {
  type NotificationSearchParams,
  readNotificationPageParams,
} from "@/features/notification/lib/list-params";
import { NotificationList } from "@/features/notification/ui/notification-list";

type NotificationsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<NotificationSearchParams>;
};

export default async function NotificationsPage({ params, searchParams }: NotificationsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const view = readNotificationPageParams({ params: await searchParams });
  return (
    <SimplePage>
      <NotificationList locale={locale} params={view} />
    </SimplePage>
  );
}
