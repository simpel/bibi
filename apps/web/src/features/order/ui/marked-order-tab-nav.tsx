import { listRunSheets } from "@bibi/core";
import { CircleAlertIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { runSheetsNeedSending } from "@/features/run-sheet/lib/needs-sending";
import { runOperation } from "@/server/run-operation";
import { OrderTabNav, type OrderTabNavProps } from "./order-tab-nav";

/**
 * The order's tabs with their marks: Run sheets when one is not sent, out of date or blocked.
 * Rendered in a Suspense whose fallback is the plain tabs, so the header never waits for it.
 */
export async function MarkedOrderTabNav(props: Omit<OrderTabNavProps, "marks">) {
  const needsRunSheets = props.tabs.includes("run-sheets");
  const [t, runSheets] = await Promise.all([
    getTranslations("order.tabMarks"),
    needsRunSheets
      ? runOperation({ operation: listRunSheets, input: { orderId: props.orderId, limit: 100 } })
      : null,
  ]);
  const unsent = runSheets?.ok && runSheetsNeedSending({ runSheets: runSheets.value.items });
  return (
    <OrderTabNav
      {...props}
      marks={
        unsent
          ? { "run-sheets": { icon: <CircleAlertIcon aria-hidden />, label: t("runSheets") } }
          : {}
      }
    />
  );
}
