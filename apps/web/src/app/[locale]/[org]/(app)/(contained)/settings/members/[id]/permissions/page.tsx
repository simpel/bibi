import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { memberPermissionsRoute } from "@/lib/routes";

type MemberPermissionsPageProps = { params: Promise<{ locale: string; org: string; id: string }> };

export default async function SettingsMemberPermissionsRedirect({
  params,
}: MemberPermissionsPageProps) {
  const { locale, org, id } = await params;
  redirect({ href: memberPermissionsRoute({ id }), locale: resolveLocale({ value: locale }), org });
}
