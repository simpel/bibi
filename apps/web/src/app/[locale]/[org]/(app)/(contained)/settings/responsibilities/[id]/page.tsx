import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type PageProps = { params: Promise<{ locale: string; org: string; id: string }> };

export default async function ResponsibilityRedirect({ params }: PageProps) {
  const { locale, org, id } = await params;
  redirect({
    href: `${ROUTES.settingsResponsibilities}/${encodeURIComponent(id)}/update`,
    locale: resolveLocale({ value: locale }),
    org,
  });
}
