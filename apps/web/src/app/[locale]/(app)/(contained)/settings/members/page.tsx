import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@bibi/i18n/navigation";
import { ROUTES } from "@/lib/routes";

type MembersPageProps = { params: Promise<{ locale: string }> };

export default async function SettingsMembersRedirect({ params }: MembersPageProps) {
  const { locale } = await params;
  redirect({ href: ROUTES.adminMembers, locale: resolveLocale({ value: locale }) });
}
