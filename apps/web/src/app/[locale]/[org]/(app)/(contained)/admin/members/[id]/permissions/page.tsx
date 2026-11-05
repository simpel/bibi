import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionPage } from "@/features/permission/ui/permission-page";
import { entityTitle } from "@/lib/page-metadata";
import { loadMember } from "@/server/load-member";

type MemberPermissionsPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: MemberPermissionsPageProps) {
  const { id } = await params;
  const res = await loadMember({ id });
  return entityTitle({
    name: res.ok ? res.value.name : null,
    fallback: "Member",
    prefix: "Permissions",
  });
}

export default async function MemberPermissionsPage({ params }: MemberPermissionsPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PermissionPage locale={locale} subjectType="member" subjectId={id} />
    </SimplePage>
  );
}
