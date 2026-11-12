import { resolveLocale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DEVELOPER_PAGES, findDeveloperPage } from "@/features/docs/pages";
import { loadDocText } from "@/features/docs/server/doc-text";
import { DeveloperPage } from "@/features/docs/ui/developer-page";

/** Developer text embeds runtime URLs (`WEB_ORIGIN`, `MCP_ORIGIN`), so it is rendered per request. */
export const dynamic = "force-dynamic";

type DeveloperRouteProps = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return DEVELOPER_PAGES.slice(1).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: DeveloperRouteProps) {
  const { locale, slug } = await params;
  const page = findDeveloperPage({ slug });
  if (!page) return {};
  const text = await loadDocText({ locale, namespace: "docs", key: `pages.developers.${page}` });
  return { title: text.title, description: text.lead };
}

export default async function DeveloperRoute({ params }: DeveloperRouteProps) {
  const { locale, slug } = await params;
  setRequestLocale(resolveLocale({ value: locale }));
  const page = findDeveloperPage({ slug });
  if (!page) notFound();
  return <DeveloperPage locale={locale} slug={page} />;
}
