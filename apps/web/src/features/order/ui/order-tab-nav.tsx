import { Tabs, TabsList, TabsTrigger } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";
import type { OrderTab } from "../order-tabs";

/** The page tour's target on each tab, where it has one. */
const TOUR: Partial<Record<OrderTab, string>> = {
  program: "order.program",
  "run-sheets": "order.runSheets",
  money: "order.money",
  details: "order.details",
};

/** The i18n key of each tab's label under `order.tabs`. */
const LABEL = {
  program: "program",
  customer: "customer",
  "run-sheets": "runSheets",
  money: "money",
  details: "details",
  comments: "comments",
  messages: "messages",
  activity: "activity",
} as const satisfies Record<OrderTab, string>;

/** A small icon after a tab's label that something there needs a look, and what, in words. */
export type OrderTabMark = { icon: ReactNode; label: string };

export type OrderTabNavProps = {
  orderId: string;
  tabs: readonly OrderTab[];
  current: OrderTab;
  /** An icon per tab, e.g. on Run sheets when one is not sent or out of date. */
  marks?: Partial<Record<OrderTab, OrderTabMark>>;
};

/**
 * The order page's tabs as links (`?tab=`) along the bottom of its header: only the open tab's
 * sections load (ADR 0097).
 */
export async function OrderTabNav({ orderId, tabs, current, marks }: OrderTabNavProps) {
  const t = await getTranslations("order.tabs");
  const base = orderRoute({ id: orderId });
  return (
    <Tabs value={current} className="min-w-0">
      <TabsList
        variant="line"
        aria-label={t("label")}
        className="max-w-full justify-start overflow-x-auto"
      >
        {tabs.map((tab) => {
          const mark = marks?.[tab];
          return (
            <TabsTrigger
              key={tab}
              value={tab}
              variant="line"
              asChild
              className="flex-none gap-1.5"
              data-tour={TOUR[tab]}
            >
              <Link href={`${base}?tab=${tab}`} scroll={false}>
                {t(LABEL[tab])}
                {mark ? (
                  <span
                    data-slot="tab-mark"
                    title={mark.label}
                    className="inline-flex text-warning [&_svg]:size-3.5"
                  >
                    {mark.icon}
                    <span className="sr-only">{mark.label}</span>
                  </span>
                ) : null}
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
