import type { OrderStatusDto } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { StatusFlowTable } from "./status-flow-table";

export type FlowEditorProps = { statuses: readonly OrderStatusDto[] };

/**
 * The flow rules on `/admin/pipeline` (ADR 0076, `pipeline:write`): per status where its orders
 * may move, and what moves into it require; a row opens the status's page where they are edited.
 * Boards never edit these rules.
 */
export async function FlowEditor({ statuses }: FlowEditorProps) {
  const t = await getTranslations("orderStatus.flow");
  if (statuses.length === 0) return null;
  return (
    <AdminSection id="flow-rules" title={t("title")} description={t("description")}>
      <StatusFlowTable statuses={statuses} />
    </AdminSection>
  );
}
