import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { memberRoute } from "@/lib/routes";

type MemberPageProps = { params: Promise<{ locale: string; org: string; id: string }> };

export default async function SettingsMemberRedirect({ params }: MemberPageProps) {
  const { locale, org, id } = await params;
  redirect({ href: memberRoute({ id }), locale: resolveLocale({ value: locale }), org });
}
