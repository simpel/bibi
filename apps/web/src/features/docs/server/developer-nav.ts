import "server-only";
import { resolveLocale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import type { HelpNavGroup } from "@/components/help-shell/help-nav";
import { DEVELOPER_PAGES, developerHref, MCP_REFERENCE_HREF, REST_REFERENCE_HREF } from "../pages";
import { loadDocText } from "./doc-text";

export type DeveloperNavGroupsInput = { locale: string };

/** Sidebar of `/developers`: the developer pages, then the REST and MCP reference. */
export async function developerNavGroups({
  locale,
}: DeveloperNavGroupsInput): Promise<HelpNavGroup[]> {
  const t = await getTranslations({ locale: resolveLocale({ value: locale }), namespace: "docs" });
  const pages = await Promise.all(
    DEVELOPER_PAGES.map(async (slug) => {
      const text = await loadDocText({
        locale,
        namespace: "docs",
        key: `pages.developers.${slug}`,
      });
      return { href: developerHref({ slug }), label: text.title };
    }),
  );
  return [
    { label: t("sections.developers"), links: pages },
    {
      label: t("sections.reference"),
      links: [
        { href: REST_REFERENCE_HREF, label: t("reference.rest.title"), external: true },
        { href: MCP_REFERENCE_HREF, label: t("reference.mcp.title") },
      ],
    },
  ];
}
