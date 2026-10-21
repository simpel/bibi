import { listLines, type TicketDto } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { AlternativeGroupSection } from "@/features/alternative-group/ui/alternative-group-section";
import { type CallerAbilities, can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadProgramData } from "../load-program-data";
import { CreateLineButton } from "./create-line-button";
import { ExpandBundleButton } from "./expand-bundle-button";
import type { ProgramAccess } from "./program-row-actions";
import { ProgramTable } from "./program-table";

export type ProgramSectionProps = { locale: Locale; ticket: TicketDto };

/** Editing a line and changing its state are `program:write`, removing it `program:delete`. */
function programAccess({ abilities }: { abilities: CallerAbilities }): ProgramAccess {
  const canWrite = can({ abilities, permission: "program:write" });
  const canRemove = can({ abilities, permission: "program:delete" });
  return { canEdit: canWrite, canRemove, canChangeState: canWrite };
}

/** The ticket's run schedule (ADR 0022): lines in time order, edited inline, then its alternatives. */
export async function ProgramSection({ locale, ticket }: ProgramSectionProps) {
  const t = await getTranslations("line");
  const access = programAccess({ abilities: await getCallerAbilities() });
  const [lines, data] = await Promise.all([
    runOperation({ operation: listLines, input: { ticketId: ticket.id, limit: 100 } }),
    loadProgramData(),
  ]);
  if (!lines.ok && lines.error.code === "FORBIDDEN") return null;
  if (!lines.ok) {
    return <ErrorState errorKey={handleLoadError({ error: lines.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const items = lines.value.items;
  const start = {
    data: data.value,
    ticketId: ticket.id,
    startsAt: ticket.desiredStartsAt ?? new Date(),
  };
  return (
    <>
      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{t("plural")}</h2>
          {access.canEdit ? (
            <div className="flex flex-wrap gap-2">
              <ExpandBundleButton {...start} />
              <CreateLineButton {...start} />
            </div>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ProgramTable lines={items} data={data.value} access={access} />
        )}
      </section>
      <AlternativeGroupSection locale={locale} ticket={ticket} />
    </>
  );
}
