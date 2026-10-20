import { listAlternativeGroups, listLines, type TicketDto } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { AlternativeGroupTable } from "./alternative-group-table";
import { CreateAlternativeGroupButton } from "./create-alternative-group-button";
import type { OptionLine } from "./option-line";

export type AlternativeGroupSectionProps = { locale: Locale; ticket: TicketDto };

/** The ticket's alternatives (ADR 0052): lines the customer picks one of, chosen from here. */
export async function AlternativeGroupSection({ locale, ticket }: AlternativeGroupSectionProps) {
  const t = await getTranslations("alternativeGroup");
  const { lineWrite } = await getCallerAbilities();
  const input = { ticketId: ticket.id, limit: 100 };
  const [groups, lines] = await Promise.all([
    runOperation({ operation: listAlternativeGroups, input }),
    runOperation({ operation: listLines, input }),
  ]);
  if (!groups.ok) {
    return <ErrorState errorKey={handleLoadError({ error: groups.error, locale })} />;
  }
  if (!lines.ok) return <ErrorState errorKey={handleLoadError({ error: lines.error, locale })} />;
  const options: OptionLine[] = lines.value.items.map(({ id, name, alternativeGroupId }) => ({
    ...{ id, name, alternativeGroupId },
  }));
  const free = options.filter((line) => line.alternativeGroupId === null);
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("plural")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        {lineWrite && free.length >= 2 ? (
          <CreateAlternativeGroupButton ticketId={ticket.id} lines={free} />
        ) : null}
      </div>
      {groups.value.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <AlternativeGroupTable groups={groups.value.items} lines={options} canWrite={lineWrite} />
      )}
    </section>
  );
}
