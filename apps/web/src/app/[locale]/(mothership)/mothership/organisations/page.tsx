import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type AdminOrganisationsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminOrganisationsPage({ params }: AdminOrganisationsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  redirect({ href: ROUTES.mothershipOrganizations, locale });
}
