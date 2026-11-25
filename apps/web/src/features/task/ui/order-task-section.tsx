import type { OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { taskNewRoute } from "@/lib/routes";
import { TaskSection } from "./task-section";

export type OrderTaskSectionProps = { locale: Locale; order: Pick<OrderDto, "id"> };

/** The order page's Tasks tab: the tasks linked to it, and Create task for it. */
export async function OrderTaskSection({ locale, order }: OrderTaskSectionProps) {
  const t = await getTranslations("task.section");
  return (
    <TaskSection
      locale={locale}
      filter={{ orderId: order.id }}
      createHref={taskNewRoute({ orderId: order.id })}
      empty={t("orderEmpty")}
    />
  );
}
