import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PermissionPage } from "@/features/permission/ui/permission-page";

type MemberPermissionsPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function MemberPermissionsPage({ params }: MemberPermissionsPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <PermissionPage locale={locale} subjectType="member" subjectId={id} />;
}
