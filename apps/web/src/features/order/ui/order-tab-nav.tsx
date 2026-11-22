import { Tabs, TabsList, TabsTrigger } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import type { OrderTab } from "../order-tabs";

/** The page tour's target on each tab, where it has one. */
const TOUR: Partial<Record<OrderTab, string>> = {
  program: "order.program",
  "run-sheets": "order.runSheets",
  money: "order.money",
};

/** The i18n key of each tab's label under `order.tabs`. */
const LABEL = {
  program: "program",
  "run-sheets": "runSheets",
  money: "money",
  activity: "activity",
} as const satisfies Record<OrderTab, string>;

export type OrderTabNavProps = { orderId: string; tabs: readonly OrderTab[]; current: OrderTab };

/** The order page's tabs as links (`?tab=`): only the open tab's sections load (ADR 0097). */
export async function OrderTabNav({ orderId, tabs, current }: OrderTabNavProps) {
  const t = await getTranslations("order.tabs");
  const base = orderRoute({ id: orderId });
  return (
    <Tabs value={current} className="min-w-0">
      <TabsList aria-label={t("label")} className="max-w-full justify-start overflow-x-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} asChild className="flex-none" data-tour={TOUR[tab]}>
            <Link href={`${base}?tab=${tab}`} scroll={false}>
              {t(LABEL[tab])}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
