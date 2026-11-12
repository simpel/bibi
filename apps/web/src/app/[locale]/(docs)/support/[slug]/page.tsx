import { resolveLocale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { findGuidePage, GUIDE_PAGES, guideHref } from "@/features/docs/pages";
import { loadDocText } from "@/features/docs/server/doc-text";
import { DocArticle } from "@/features/docs/ui/doc-article";

/** Guide text embeds runtime URLs (`WEB_ORIGIN`, `MCP_ORIGIN`), so it is rendered per request. */
export const dynamic = "force-dynamic";

type GuidePageProps = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return GUIDE_PAGES.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GuidePageProps) {
  const { locale, slug } = await params;
  const page = findGuidePage({ slug });
  if (!page) return {};
  const text = await loadDocText({ locale, namespace: "support", key: `guides.${page}` });
  return { title: text.title, description: text.lead };
}

/** A staff guide; the text comes from i18n (`support.guides.<slug>`). */
export default async function GuidePage({ params }: GuidePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(resolveLocale({ value: locale }));
  const page = findGuidePage({ slug });
  if (!page) notFound();
  const text = await loadDocText({ locale, namespace: "support", key: `guides.${page}` });
  return (
    <>
      <CrumbName href={guideHref({ slug: page })} name={text.title} />
      <DocArticle title={text.title} lead={text.lead} markdown={text.body} />
    </>
  );
}
