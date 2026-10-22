import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type MembersPageProps = { params: Promise<{ locale: string; org: string }> };

export default async function SettingsMembersRedirect({ params }: MembersPageProps) {
  const { locale, org } = await params;
  redirect({ href: ROUTES.adminMembers, locale: resolveLocale({ value: locale }), org });
}
