import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type PageProps = { params: Promise<{ locale: string; org: string; id: string }> };

/** The old edit page: a template is edited in place on its own page now. */
export default async function OrderTemplateUpdateRedirect({ params }: PageProps) {
  const { locale, org, id } = await params;
  redirect({
    href: `${ROUTES.packages}/${encodeURIComponent(id)}`,
    locale: resolveLocale({ value: locale }),
    org,
  });
}
