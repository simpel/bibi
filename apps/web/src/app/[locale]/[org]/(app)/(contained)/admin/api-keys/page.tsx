import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type PageProps = { params: Promise<{ locale: string; org: string }> };

/** This list is a section of a page now; the old address opens it there. */
export default async function OldListRedirect({ params }: PageProps) {
  const { locale, org } = await params;
  redirect({
    href: `${ROUTES.adminIntegrations}#api-keys`,
    locale: resolveLocale({ value: locale }),
    org,
  });
}
