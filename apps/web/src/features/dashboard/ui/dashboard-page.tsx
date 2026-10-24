import { pipelineBoard } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Badge } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";

export type DashboardPageProps = { locale: Locale };

/** `/dashboard`: ticket counts grouped by status and by the closing flag (ADR 0041, 0043). */
export async function DashboardPage({ locale }: DashboardPageProps) {
  const t = await getTranslations("dashboard");
  const board = await runOperation({ operation: pipelineBoard, input: {} });
  if (!board.ok) return <ErrorState errorKey={handleLoadError({ error: board.error, locale })} />;
  const { columns, cards } = board.value;
  const lanes = columns.map((column) => ({
    ...column,
    count: cards.filter((card) => card.columnId === column.id).length,
  }));
  const total = ({ closed }: { closed: boolean }) =>
    lanes.filter((lane) => lane.closed === closed).reduce((sum, lane) => sum + lane.count, 0);
  return (
    <div className="min-h-0 flex-1 overflow-auto p-6">
      <h1 className="font-serif text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <dl className="mt-6 flex gap-8 text-sm">
        <div>
          <dt className="text-muted-foreground">{t("openTickets")}</dt>
          <dd className="text-2xl font-semibold">{total({ closed: false })}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("closedTickets")}</dt>
          <dd className="text-2xl font-semibold">{total({ closed: true })}</dd>
        </div>
      </dl>
      <h2 className="mt-6 text-sm font-medium">{t("byStatus")}</h2>
      {cards.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : null}
      <ul className="mt-2 flex flex-wrap gap-2">
        {lanes.map((lane) => (
          <li key={lane.id}>
            <Badge variant="outline">
              {lane.title}: {lane.count}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
