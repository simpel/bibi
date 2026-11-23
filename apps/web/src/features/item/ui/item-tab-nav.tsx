import { Tabs, TabsList, TabsTrigger } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { itemRoute } from "@/lib/routes";
import type { ItemTab } from "../item-tabs";

export type ItemTabNavProps = { itemId: string; tabs: readonly ItemTab[]; current: ItemTab };

/**
 * The item page's tabs as links (`?tab=`) along the bottom of its header, like the order page's:
 * only the open tab's sections load (ADR 0097).
 */
export async function ItemTabNav({ itemId, tabs, current }: ItemTabNavProps) {
  const t = await getTranslations("item.tabs");
  const base = itemRoute({ id: itemId });
  return (
    <Tabs value={current} className="min-w-0">
      <TabsList
        variant="line"
        aria-label={t("label")}
        className="max-w-full justify-start overflow-x-auto"
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} variant="line" asChild className="flex-none">
            <Link href={`${base}?tab=${tab}`} scroll={false}>
              {t(tab)}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
