import { getUserSettings } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/states/page-header";
import { NotificationPreferencesSection } from "@/features/notification/ui/notification-preferences-section";
import { OauthGrantSection } from "@/features/oauth-grant/ui/oauth-grant-section";
import { DisplayFormatForm } from "@/features/user-settings/ui/display-format-form";
import { runOperation } from "@/server/run-operation";
import { ProfileNameForm } from "./profile-name-form";
import { ProfileSectionNav } from "./profile-section-nav";
import type { ProfileSectionId } from "./profile-sections";
import { ProfileSessions } from "./profile-sessions";

export type ProfileViewProps = { name: string; email: string; locale: Locale };

type ProfileCardProps = {
  id: ProfileSectionId;
  title: string;
  description?: string;
  children: ReactNode;
};

function ProfileCard({ id, title, description, children }: ProfileCardProps) {
  return (
    <Card id={id} className="scroll-mt-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const NO_FORMATS = {
  dateFormat: null,
  clockFormat: null,
  numberFormat: null,
  moneyFormat: null,
};

/**
 * Profile page body: name, email (read-only), formats, notifications, sessions and
 * connected apps, with an in-page nav.
 */
export async function ProfileView({ name, email, locale }: ProfileViewProps) {
  const [t, settings] = await Promise.all([
    getTranslations("profile"),
    runOperation({ operation: getUserSettings, input: {} }),
  ]);
  return (
    <div className="grid max-w-4xl grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[10rem_minmax(0,1fr)] md:items-start">
      <div className="md:col-span-2">
        <PageHeader title={t("title")} description={t("description")} />
      </div>
      <ProfileSectionNav />
      <div className="grid min-w-0 gap-6">
        <ProfileCard id="details" title={t("details")}>
          <ProfileNameForm name={name} email={email} />
        </ProfileCard>
        <ProfileCard id="display" title={t("displayTitle")} description={t("displayDescription")}>
          <DisplayFormatForm formats={settings.ok ? settings.value : NO_FORMATS} />
        </ProfileCard>
        <NotificationPreferencesSection id="notifications" locale={locale} />
        <ProfileCard
          id="sessions"
          title={t("sessionsTitle")}
          description={t("sessionsDescription")}
        >
          <ProfileSessions />
        </ProfileCard>
        <OauthGrantSection id="apps" locale={locale} />
      </div>
    </div>
  );
}
