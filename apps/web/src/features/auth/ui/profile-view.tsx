import { getUserSettings } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/states/page-header";
import { OauthGrantSection } from "@/features/oauth-grant/ui/oauth-grant-section";
import { DisplayFormatForm } from "@/features/user-settings/ui/display-format-form";
import { runOperation } from "@/server/run-operation";
import { ProfileNameForm } from "./profile-name-form";
import { ProfilePasswordForm } from "./profile-password-form";
import { ProfileSessions } from "./profile-sessions";

export type ProfileViewProps = { name: string; email: string; locale: Locale };

type ProfileCardProps = { title: string; description?: string; children: ReactNode };

function ProfileCard({ title, description, children }: ProfileCardProps) {
  return (
    <Card>
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
  currencyDisplay: null,
};

/** Profile page body: name, email (read-only), date and clock format, password, active sessions and connected apps. */
export async function ProfileView({ name, email, locale }: ProfileViewProps) {
  const t = await getTranslations("profile");
  const settings = await runOperation({ operation: getUserSettings, input: {} });
  return (
    <div className="grid max-w-2xl gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ProfileCard title={t("details")}>
        <ProfileNameForm name={name} email={email} />
      </ProfileCard>
      <ProfileCard title={t("displayTitle")} description={t("displayDescription")}>
        <DisplayFormatForm formats={settings.ok ? settings.value : NO_FORMATS} />
      </ProfileCard>
      <ProfileCard title={t("passwordTitle")} description={t("passwordDescription")}>
        <ProfilePasswordForm />
      </ProfileCard>
      <ProfileCard title={t("sessionsTitle")} description={t("sessionsDescription")}>
        <ProfileSessions />
      </ProfileCard>
      <OauthGrantSection locale={locale} />
    </div>
  );
}
