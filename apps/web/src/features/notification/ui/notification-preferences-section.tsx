import { listNotificationPreferences } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { NotificationPreferences } from "./notification-preferences";

export type NotificationPreferencesSectionProps = { locale: Locale; id?: string };

/** The signed-in member's choice of notifications in this organization, on the profile page. */
export async function NotificationPreferencesSection({
  locale,
  id,
}: NotificationPreferencesSectionProps) {
  const t = await getTranslations("profile");
  const preferences = await runOperation({ operation: listNotificationPreferences, input: {} });
  return (
    <Card id={id} className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{t("notificationsTitle")}</CardTitle>
        <CardDescription>{t("notificationsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {preferences.ok ? (
          <NotificationPreferences preferences={preferences.value.items} />
        ) : (
          <ErrorState inline errorKey={handleLoadError({ error: preferences.error, locale })} />
        )}
      </CardContent>
    </Card>
  );
}
