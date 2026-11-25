import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { taskNewRoute } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { TaskSection } from "./task-section";

export type CustomerTaskSectionProps = { locale: Locale; customerId: string };

/** The customer page's tasks after its contacts; nothing without `task:read`. */
export async function CustomerTaskSection({ locale, customerId }: CustomerTaskSectionProps) {
  const [t, abilities] = await Promise.all([getTranslations("task.section"), getCallerAbilities()]);
  if (!can({ abilities, permission: "task:read" })) return null;
  return (
    <TaskSection
      locale={locale}
      filter={{ customerId }}
      createHref={taskNewRoute({ customerId })}
      empty={t("empty")}
    />
  );
}
