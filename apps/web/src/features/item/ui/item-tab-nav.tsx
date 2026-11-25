import { getTranslations } from "next-intl/server";
import { PageTabNav } from "@/components/states/page-tab-nav";
import { itemRoute } from "@/lib/routes";
import type { HoursKind, ItemTab } from "../item-tabs";

export type ItemTabNavProps = {
  itemId: string;
  tabs: readonly ItemTab[];
  current: ItemTab;
  hoursKind: HoursKind;
};

/** The item page's tabs, like the order page's; the hours tab is named by the item's kind. */
export async function ItemTabNav({ itemId, tabs, current, hoursKind }: ItemTabNavProps) {
  const t = await getTranslations("item.tabs");
  return (
    <PageTabNav
      base={itemRoute({ id: itemId })}
      label={t("label")}
      current={current}
      tabs={tabs.map((tab) => ({
        id: tab,
        label: tab === "hours" ? t("hours", { kind: hoursKind }) : t(tab),
      }))}
    />
  );
}
