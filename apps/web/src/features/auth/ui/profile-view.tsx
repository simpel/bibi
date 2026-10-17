import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/states/page-header";
import { ProfileNameForm } from "./profile-name-form";
import { ProfilePasswordForm } from "./profile-password-form";
import { ProfileSessions } from "./profile-sessions";

export type ProfileViewProps = { name: string; email: string };

/** Profile page body: name, email (read-only), password and active sessions. */
export async function ProfileView({ name, email }: ProfileViewProps) {
  const t = await getTranslations("profile");
  return (
    <div className="grid max-w-2xl gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileNameForm name={name} email={email} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("passwordTitle")}</CardTitle>
          <CardDescription>{t("passwordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfilePasswordForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("sessionsTitle")}</CardTitle>
          <CardDescription>{t("sessionsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSessions />
        </CardContent>
      </Card>
    </div>
  );
}
