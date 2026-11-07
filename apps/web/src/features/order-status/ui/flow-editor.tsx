import type { OrderStatusDto } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { StatusFlowCard } from "./status-flow-card";

export type FlowEditorProps = { statuses: readonly OrderStatusDto[] };

/**
 * The flow editor on `/admin/pipeline` (ADR 0076, `pipeline:write`): per status where its
 * orders may move, and what moves into it require. Boards never edit these rules.
 */
export async function FlowEditor({ statuses }: FlowEditorProps) {
  const t = await getTranslations("orderStatus.flow");
  if (statuses.length === 0) return null;
  return (
    <AdminSection title={t("title")} description={t("description")}>
      <div className="grid gap-3 lg:grid-cols-2">
        {statuses.map((orderStatus) => (
          <StatusFlowCard key={orderStatus.id} orderStatus={orderStatus} statuses={statuses} />
        ))}
      </div>
    </AdminSection>
  );
}
