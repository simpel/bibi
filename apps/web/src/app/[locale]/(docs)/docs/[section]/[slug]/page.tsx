import { resolveLocale } from "@okazi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DOC_SECTIONS, findDocPage } from "@/features/docs/pages";
import { loadDocText } from "@/features/docs/server/doc-text";
import { DocArticle } from "@/features/docs/ui/doc-article";

/** Docs text embeds runtime URLs (`WEB_URL`, `MCP_URL`), so it is rendered per request. */
export const dynamic = "force-dynamic";

type DocPageProps = { params: Promise<{ locale: string; section: string; slug: string }> };

export function generateStaticParams() {
  return Object.entries(DOC_SECTIONS).flatMap(([section, slugs]) =>
    slugs.map((slug) => ({ section, slug })),
  );
}

export async function generateMetadata({ params }: DocPageProps) {
  const { locale, section, slug } = await params;
  const page = findDocPage({ section, slug });
  if (!page) return {};
  const text = await loadDocText({ locale, key: `pages.${page.section}.${page.slug}` });
  return { title: `${text.title} · Okazi`, description: text.lead };
}

/** A guide or developer page; the text comes from i18n (`docs.pages.<section>.<slug>`). */
export default async function DocPage({ params }: DocPageProps) {
  const { locale, section, slug } = await params;
  setRequestLocale(resolveLocale({ value: locale }));
  const page = findDocPage({ section, slug });
  if (!page) notFound();
  const text = await loadDocText({ locale, key: `pages.${page.section}.${page.slug}` });
  return <DocArticle title={text.title} lead={text.lead} markdown={text.body} />;
}
