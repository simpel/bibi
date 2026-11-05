import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type PageProps = { params: Promise<{ locale: string; org: string; id: string }> };

export default async function OrderStatusRedirect({ params }: PageProps) {
  const { locale, org, id } = await params;
  redirect({
    href: `${ROUTES.settingsPipeline}/${encodeURIComponent(id)}/update`,
    locale: resolveLocale({ value: locale }),
    org,
  });
}
