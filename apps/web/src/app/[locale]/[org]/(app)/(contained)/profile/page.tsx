import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { ProfileView } from "@/features/auth/ui/profile-view";
import { requireReadySession } from "@/server/guard";

type ProfilePageProps = { params: Promise<{ locale: string }> };

export default async function ProfilePage({ params }: ProfilePageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { session } = await requireReadySession({ locale });
  return (
    <SimplePage>
      <ProfileView name={session.user.name} email={session.user.email} locale={locale} />
    </SimplePage>
  );
}
