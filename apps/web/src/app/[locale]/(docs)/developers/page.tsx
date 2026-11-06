import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { DEVELOPER_PAGES } from "@/features/docs/pages";
import { DeveloperPage } from "@/features/docs/ui/developer-page";

/** Developer text embeds runtime URLs (`WEB_URL`, `MCP_URL`), so it is rendered per request. */
export const dynamic = "force-dynamic";

type DevelopersHomeProps = { params: Promise<{ locale: string }> };

/** `/developers` shows the overview page. */
export default async function DevelopersHome({ params }: DevelopersHomeProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <DeveloperPage locale={locale} slug={DEVELOPER_PAGES[0]} />;
}
