import { listRequirements, type OrderDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { loadOrderLines } from "@/features/line/load-order-lines";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadRequirementData } from "../load-requirement-data";
import { CreateRequirementButton } from "./create-requirement-button";
import { RequirementTable } from "./requirement-table";

export type RequirementSectionProps = { locale: Locale; order: OrderDto };

/**
 * The order's requirements (ADR 0021): counts against list values for the whole order or a
 * line, where they replace the order's count. Counts only, never people.
 */
export async function RequirementSection({ locale, order }: RequirementSectionProps) {
  const [t, abilities, requirements, lines] = await Promise.all([
    getTranslations("requirement"),
    getCallerAbilities(),
    runOperation({ operation: listRequirements, input: { orderId: order.id, limit: 100 } }),
    loadOrderLines({ orderId: order.id }),
  ]);
  const access = {
    canEdit: can({ abilities, permission: "program:write" }),
    canRemove: can({ abilities, permission: "program:delete" }),
  };
  for (const result of [requirements, lines]) {
    if (!result.ok && result.error.code === "FORBIDDEN") return null;
    if (!result.ok)
      return <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />;
  }
  if (!requirements.ok || !lines.ok) return null;
  const data = await loadRequirementData({ lines: lines.value.items });
  if (!data.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: data.error, locale })} />;
  const rows = requirements.value.items;
  return (
    <section className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{t("plural")}</h2>
        {can({ abilities, permission: "program:write" }) ? (
          <CreateRequirementButton data={data.value} orderId={order.id} />
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <RequirementTable requirements={rows} data={data.value} access={access} />
      )}
    </section>
  );
}
