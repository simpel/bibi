import type { TicketStatusDto } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { StatusFlowCard } from "./status-flow-card";

export type FlowEditorProps = { statuses: readonly TicketStatusDto[] };

/**
 * The flow editor on `/settings/pipeline` (ADR 0076, `pipeline:write`): per status where its
 * tickets may move, and what moves into it require. Boards never edit these rules.
 */
export async function FlowEditor({ statuses }: FlowEditorProps) {
  const t = await getTranslations("ticketStatus.flow");
  if (statuses.length === 0) return null;
  return (
    <section className="grid gap-3" aria-labelledby="flow-editor-title">
      <div className="grid gap-1">
        <h2 id="flow-editor-title" className="text-xl font-medium">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {statuses.map((ticketStatus) => (
          <StatusFlowCard key={ticketStatus.id} ticketStatus={ticketStatus} statuses={statuses} />
        ))}
      </div>
    </section>
  );
}
