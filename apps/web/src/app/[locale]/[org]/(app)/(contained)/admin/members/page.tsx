import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AdminSections } from "@/components/admin/admin-sections";
import { loadAdminPage } from "@/components/admin/load-admin-page";
import { InvitationList } from "@/features/member/ui/invitation-list";
import { MemberList } from "@/features/member/ui/member-list";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "members" });
}

export default async function MembersPage({ params }: PageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { title, show } = await loadAdminPage({ key: "members" });
  return (
    <AdminSections title={title}>
      {show.has("members") ? <MemberList locale={locale} /> : null}
      {show.has("invitations") ? <InvitationList locale={locale} /> : null}
    </AdminSections>
  );
}
