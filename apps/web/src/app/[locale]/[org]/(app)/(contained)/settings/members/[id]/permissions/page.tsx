import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { entityTitle } from "@/lib/page-metadata";
import { memberPermissionsRoute } from "@/lib/routes";
import { loadMember } from "@/server/load-member";

type MemberPermissionsPageProps = { params: Promise<{ locale: string; org: string; id: string }> };

export async function generateMetadata({ params }: MemberPermissionsPageProps) {
  const { id } = await params;
  const res = await loadMember({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "Member",
    prefix: "Permissions",
  });
}

export default async function SettingsMemberPermissionsRedirect({
  params,
}: MemberPermissionsPageProps) {
  const { locale, org, id } = await params;
  redirect({ href: memberPermissionsRoute({ id }), locale: resolveLocale({ value: locale }), org });
}
