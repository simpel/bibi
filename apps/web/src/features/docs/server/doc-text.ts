import "server-only";
import { getEnv } from "@bibi/config";
import { resolveLocale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";

/** `docs` holds the developer pages, `support` the staff guides. */
export type DocTextInput = { locale: string; namespace: "docs" | "support"; key: string };

export type DocText = { title: string; lead: string; body: string };

/** Keys are built from the page registries, so the namespace is read untyped here. */
type DocsTranslator = {
  (key: string): string;
  raw(key: string): unknown;
  has(key: string): boolean;
};

/** `{{webUrl}}` and `{{mcpUrl}}` in docs markdown become this deployment's URLs. */
function fillUrls({ text }: { text: string }): string {
  const { WEB_ORIGIN, MCP_ORIGIN } = getEnv();
  return text.replaceAll("{{webUrl}}", WEB_ORIGIN).replaceAll("{{mcpUrl}}", MCP_ORIGIN);
}

/** Title, lead and markdown body of a docs page. Bodies are read raw (no ICU parsing). */
export async function loadDocText({ locale, namespace, key }: DocTextInput): Promise<DocText> {
  const t = (await getTranslations({
    locale: resolveLocale({ value: locale }),
    namespace,
  })) as unknown as DocsTranslator;
  return {
    title: t(`${key}.title`),
    lead: t(`${key}.lead`),
    body: t.has(`${key}.body`) ? fillUrls({ text: String(t.raw(`${key}.body`)) }) : "",
  };
}
