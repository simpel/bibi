import "server-only";
import { getEnv } from "@bibi/config";
import { resolveLocale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";

export type DocTextInput = { locale: string; key: string };

export type DocText = { title: string; lead: string; body: string };

/** Keys are built from the page registry, so the docs namespace is read untyped here. */
type DocsTranslator = {
  (key: string): string;
  raw(key: string): unknown;
  has(key: string): boolean;
};

/** `{{webUrl}}` and `{{mcpUrl}}` in docs markdown become this deployment's URLs. */
function fillUrls({ text }: { text: string }): string {
  const { WEB_URL, MCP_URL } = getEnv();
  return text.replaceAll("{{webUrl}}", WEB_URL).replaceAll("{{mcpUrl}}", MCP_URL);
}

/** Title, lead and markdown body of a docs page. Bodies are read raw (no ICU parsing). */
export async function loadDocText({ locale, key }: DocTextInput): Promise<DocText> {
  const t = (await getTranslations({
    locale: resolveLocale({ value: locale }),
    namespace: "docs",
  })) as unknown as DocsTranslator;
  return {
    title: t(`${key}.title`),
    lead: t(`${key}.lead`),
    body: t.has(`${key}.body`) ? fillUrls({ text: String(t.raw(`${key}.body`)) }) : "",
  };
}
