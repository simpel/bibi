import { listProgramItems, type TicketDto } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadProgramData } from "../load-program-data";
import { CreateProgramItemButton } from "./create-program-item-button";
import { ProgramTable } from "./program-table";

export type ProgramSectionProps = { locale: Locale; ticket: TicketDto };

/** The ticket's run schedule (ADR 0022): program items in time order, edited inline. */
export async function ProgramSection({ locale, ticket }: ProgramSectionProps) {
  const t = await getTranslations("programItem");
  const abilities = await getCallerAbilities();
  const access = {
    canEdit: can({ abilities, permission: "program:write" }),
    canRemove: can({ abilities, permission: "program:delete" }),
    canChangeState: can({ abilities, permission: "program:write" }),
  };
  const [programItems, data] = await Promise.all([
    runOperation({ operation: listProgramItems, input: { ticketId: ticket.id, limit: 100 } }),
    loadProgramData(),
  ]);
  if (!programItems.ok && programItems.error.code === "FORBIDDEN") return null;
  if (!programItems.ok) {
    return <ErrorState errorKey={handleLoadError({ error: programItems.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const items = programItems.value.items;
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("plural")}</h2>
        {can({ abilities, permission: "program:write" }) ? (
          <CreateProgramItemButton
            data={data.value}
            ticketId={ticket.id}
            startsAt={ticket.desiredStartsAt ?? new Date()}
          />
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ProgramTable programItems={items} data={data.value} access={access} />
      )}
    </section>
  );
}
