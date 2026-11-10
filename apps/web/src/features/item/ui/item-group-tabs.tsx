import { Tabs, TabsList, TabsTrigger } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { GroupTab } from "../group-tabs";

export type ItemGroupTabsProps = { tabs: GroupTab[]; current: string };

/** One tab per item type group; each tab is its own URL (`?group=`), so the URL is the state. */
export async function ItemGroupTabs({ tabs, current }: ItemGroupTabsProps) {
  const t = await getTranslations("item");
  return (
    <Tabs value={current} className="min-w-0">
      <TabsList aria-label={t("groupTabs")} className="max-w-full justify-start overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} asChild className="flex-none">
            <Link href={{ pathname: ROUTES.items, query: { group: tab.key } }}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
