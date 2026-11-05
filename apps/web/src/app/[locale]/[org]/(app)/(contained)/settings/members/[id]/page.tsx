import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { entityTitle } from "@/lib/page-metadata";
import { memberRoute } from "@/lib/routes";
import { loadMember } from "@/server/load-member";

type MemberPageProps = { params: Promise<{ locale: string; org: string; id: string }> };

export async function generateMetadata({ params }: MemberPageProps) {
  const { id } = await params;
  const res = await loadMember({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "Member",
  });
}

export default async function SettingsMemberRedirect({ params }: MemberPageProps) {
  const { locale, org, id } = await params;
  redirect({ href: memberRoute({ id }), locale: resolveLocale({ value: locale }), org });
}
