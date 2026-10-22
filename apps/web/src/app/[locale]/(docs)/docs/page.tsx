import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { loadDocText } from "@/features/docs/server/doc-text";
import { DocArticle } from "@/features/docs/ui/doc-article";
import { DocsHomeCards } from "@/features/docs/ui/docs-home-cards";

/** Docs text embeds runtime URLs (`WEB_URL`, `MCP_URL`), so it is rendered per request. */
export const dynamic = "force-dynamic";

type DocsHomeProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: DocsHomeProps) {
  const { locale } = await params;
  const text = await loadDocText({ locale, key: "home" });
  return { title: `${text.title} · Bibi`, description: text.lead };
}

/** Docs start page: one card per audience (staff guide, developers, reference). */
export default async function DocsHome({ params }: DocsHomeProps) {
  const { locale } = await params;
  setRequestLocale(resolveLocale({ value: locale }));
  const text = await loadDocText({ locale, key: "home" });
  return (
    <DocArticle title={text.title} lead={text.lead}>
      <DocsHomeCards />
    </DocArticle>
  );
}
