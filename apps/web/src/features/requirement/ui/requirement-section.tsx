import { listLines, listRequirements, type TicketDto } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadRequirementData } from "../load-requirement-data";
import { CreateRequirementButton } from "./create-requirement-button";
import { RequirementTable } from "./requirement-table";

export type RequirementSectionProps = { locale: Locale; ticket: TicketDto };

/**
 * The ticket's requirements (ADR 0021): counts against list values for the whole ticket or a
 * line, where they replace the ticket's count. Counts only, never people.
 */
export async function RequirementSection({ locale, ticket }: RequirementSectionProps) {
  const t = await getTranslations("requirement");
  const { requirementWrite } = await getCallerAbilities();
  const input = { ticketId: ticket.id, limit: 100 };
  const [requirements, lines] = await Promise.all([
    runOperation({ operation: listRequirements, input }),
    runOperation({ operation: listLines, input }),
  ]);
  for (const result of [requirements, lines]) {
    if (!result.ok)
      return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  }
  if (!requirements.ok || !lines.ok) return null;
  const data = await loadRequirementData({ lines: lines.value.items });
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const rows = requirements.value.items;
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("plural")}</h2>
        {requirementWrite ? (
          <CreateRequirementButton data={data.value} ticketId={ticket.id} />
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <RequirementTable requirements={rows} data={data.value} canWrite={requirementWrite} />
      )}
    </section>
  );
}
