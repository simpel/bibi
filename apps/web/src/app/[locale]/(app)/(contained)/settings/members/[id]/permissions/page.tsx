import { resolveLocale } from "@okazi/i18n";
import { redirect } from "@okazi/i18n/navigation";
import { memberPermissionsRoute } from "@/lib/routes";

type MemberPermissionsPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function SettingsMemberPermissionsRedirect({
  params,
}: MemberPermissionsPageProps) {
  const { locale, id } = await params;
  redirect({ href: memberPermissionsRoute({ id }), locale: resolveLocale({ value: locale }) });
}
