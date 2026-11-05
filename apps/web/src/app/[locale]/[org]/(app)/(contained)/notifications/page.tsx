import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import {
  type NotificationSearchParams,
  readNotificationListParams,
} from "@/features/notification/lib/list-params";
import { NotificationList } from "@/features/notification/ui/notification-list";
import { pageTitle } from "@/lib/page-metadata";

type NotificationsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<NotificationSearchParams>;
};

export async function generateMetadata({ params }: NotificationsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "notifications" });
}

export default async function NotificationsPage({ params, searchParams }: NotificationsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const view = readNotificationListParams({ params: await searchParams });
  return (
    <SimplePage>
      <NotificationList locale={locale} params={view} />
    </SimplePage>
  );
}
