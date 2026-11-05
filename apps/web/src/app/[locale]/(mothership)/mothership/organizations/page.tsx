import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { OrganizationsAdminView } from "@/features/admin/organizations/organizations-admin-view";
import { pageTitle } from "@/lib/page-metadata";

type AdminOrganizationsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export async function generateMetadata() {
  return pageTitle({ namespace: "admin", key: "title" });
}

export default async function AdminOrganizationsPage({
  params,
  searchParams,
}: AdminOrganizationsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { cursor } = await searchParams;
  return (
    <OrganizationsAdminView locale={locale} cursor={Array.isArray(cursor) ? cursor[0] : cursor} />
  );
}
