import { resolveLocale } from "@okazi/i18n";
import { redirect } from "@okazi/i18n/navigation";
import { apiKeyPermissionsRoute } from "@/lib/routes";

type ApiKeyPageProps = { params: Promise<{ locale: string; id: string }> };

/** A key has no page of its own; the breadcrumb's detail crumb leads to the permissions. */
export default async function ApiKeyPage({ params }: ApiKeyPageProps) {
  const { locale, id } = await params;
  redirect({ href: apiKeyPermissionsRoute({ id }), locale: resolveLocale({ value: locale }) });
}
