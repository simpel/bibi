import "server-only";
import { resolveLocale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import type { HelpNavGroup } from "@/components/help-shell/help-nav";
import { loadGuideLinks } from "./guide-links";
import { loadSupportTopics } from "./support-topics";

export type GuideNavGroupsInput = { locale: string };

/** Sidebar of `/support`: the question topics (anchors on the start page), then the guides. */
export async function guideNavGroups({ locale }: GuideNavGroupsInput): Promise<HelpNavGroup[]> {
  const [t, topics, guides] = await Promise.all([
    getTranslations({ locale: resolveLocale({ value: locale }), namespace: "support" }),
    loadSupportTopics({ locale }),
    loadGuideLinks({ locale }),
  ]);
  return [
    {
      label: t("faqLabel"),
      links: topics.map((topic) => ({ href: `/support#${topic.id}`, label: topic.title })),
    },
    { label: t("guidesLabel"), links: guides.map(({ href, title }) => ({ href, label: title })) },
  ];
}
