import type { OrderStatusDto } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import type { ErrorKey } from "@/lib/error-key";
import { StatusFlowTable } from "./status-flow-table";

export type FlowEditorProps = {
  statuses: readonly OrderStatusDto[];
  /** The statuses failed to load: the section shows the error in place. */
  errorKey?: ErrorKey | undefined;
};

/**
 * The `flow-rules` section (ADR 0076, `pipeline:write`): per status where its orders may move,
 * and what moves into it require; a row opens the status's page where they are edited.
 * Boards never edit these rules.
 */
export async function FlowEditor({ statuses, errorKey }: FlowEditorProps) {
  const t = await getTranslations("orderStatus");
  return (
    <AdminSection section="flowRules" description={t("flow.description")}>
      {errorKey ? (
        <ErrorState errorKey={errorKey} inline />
      ) : statuses.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <StatusFlowTable statuses={statuses} />
      )}
    </AdminSection>
  );
}
