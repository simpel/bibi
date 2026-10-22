import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@bibi/i18n/navigation";
import { memberRoute } from "@/lib/routes";

type MemberPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function SettingsMemberRedirect({ params }: MemberPageProps) {
  const { locale, id } = await params;
  redirect({ href: memberRoute({ id }), locale: resolveLocale({ value: locale }) });
}
