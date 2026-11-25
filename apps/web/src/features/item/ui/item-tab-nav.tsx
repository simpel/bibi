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
  const [t, common] = await Promise.all([getTranslations("item.tabs"), getTranslations("common")]);
  const tabLabel = ({ tab }: { tab: ItemTab }) => {
    if (tab === "hours") return t("hours", { kind: hoursKind });
    if (tab === "danger") return common("dangerArea");
    return t(tab);
  };
  return (
    <PageTabNav
      base={itemRoute({ id: itemId })}
      label={t("label")}
      current={current}
      tabs={tabs.map((tab) => ({
        id: tab,
        label: tabLabel({ tab }),
      }))}
    />
  );
}
