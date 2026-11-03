import { listNotifications } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { notificationListInput } from "../lib/list-input";
import type { NotificationListParams } from "../lib/list-params";
import { NotificationTable } from "./notification-table";

export type NotificationSectionProps = {
  locale: Locale;
  title: string;
  params: NotificationListParams;
};

/** One of the page's two tables under its heading: the unread or the read notifications. */
export async function NotificationSection({ locale, title, params }: NotificationSectionProps) {
  const result = await runOperation({
    operation: listNotifications,
    input: notificationListInput({ params }),
  });
  return (
    <section className="grid gap-3">
      <h2 className="text-lg">{title}</h2>
      {result.ok ? (
        <NotificationTable
          notifications={result.value.items}
          total={result.value.total ?? 0}
          view={params}
        />
      ) : (
        <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />
      )}
    </section>
  );
}
