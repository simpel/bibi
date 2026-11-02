import { listWorkOrderDefinitions, listWorkOrders, type TicketDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { WorkOrderPanel } from "./work-order-panel";

export type WorkOrderSectionProps = { locale: Locale; ticket: TicketDto };

/**
 * The ticket's work orders (ADR 0021): per work order definition the newest version, with ★ on the rows
 * changed since the last sent one. Versions go out only from the confirmed status (`workOrder.send`).
 */
export async function WorkOrderSection({ locale, ticket }: WorkOrderSectionProps) {
  const abilities = await getCallerAbilities();
  const t = await getTranslations("workOrder");
  const [definitions, workOrders] = await Promise.all([
    runOperation({ operation: listWorkOrderDefinitions, input: { limit: 100 } }),
    runOperation({ operation: listWorkOrders, input: { ticketId: ticket.id, limit: 100 } }),
  ]);
  for (const result of [definitions, workOrders]) {
    if (!result.ok && result.error.code === "FORBIDDEN") return null;
    if (!result.ok)
      return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  }
  if (!definitions.ok || !workOrders.ok) return null;
  return (
    <section className="grid grid-cols-1 gap-4">
      <h2 className="text-xl">{t("plural")}</h2>
      {definitions.value.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        definitions.value.items.map((definition) => (
          <WorkOrderPanel
            key={definition.id}
            ticketId={ticket.id}
            definition={definition}
            workOrder={
              workOrders.value.items.find(
                (workOrder) => workOrder.workOrderDefinitionId === definition.id,
              ) ?? null
            }
            canGenerate={can({ abilities, permission: "workOrder:write" })}
            canSend={can({ abilities, permission: "workOrder:write" })}
          />
        ))
      )}
    </section>
  );
}
