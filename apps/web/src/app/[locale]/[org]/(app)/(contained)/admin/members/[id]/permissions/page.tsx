import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PermissionPage } from "@/features/permission/ui/permission-page";

type MemberPermissionsPageProps = { params: Promise<{ locale: string; id: string }> };

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
