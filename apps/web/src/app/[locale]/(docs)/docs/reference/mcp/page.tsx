import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { loadDocText } from "@/features/docs/server/doc-text";
import { mcpReference } from "@/features/docs/server/mcp-reference";
import { DocArticle } from "@/features/docs/ui/doc-article";
import { ReferenceExplorer } from "@/features/docs/ui/reference-explorer";

/** Docs text embeds runtime URLs (`WEB_URL`, `MCP_URL`), so it is rendered per request. */
export const dynamic = "force-dynamic";

type McpReferencePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: McpReferencePageProps) {
  const { locale } = await params;
  const text = await loadDocText({ locale, key: "reference.mcp" });
  return { title: `${text.title} · Bibi`, description: text.lead };
}

/** Generated from the core operations, so it always matches what the MCP server lists. */
export default async function McpReferencePage({ params }: McpReferencePageProps) {
  const { locale } = await params;
  setRequestLocale(resolveLocale({ value: locale }));
  const text = await loadDocText({ locale, key: "reference.mcp" });
  return (
    <div className="grid min-w-0 gap-8">
      <DocArticle title={text.title} lead={text.lead} markdown={text.body} />
      <ReferenceExplorer entries={mcpReference()} />
    </div>
  );
}
