import { type LineDto, lineAmounts, listLines, nestUnderParents, type TicketDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
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
import { TicketDay } from "./ticket-day";

export type ProgramSectionProps = { locale: Locale; ticket: TicketDto };

/** Editing a line and changing its state are `program:write`, removing it `program:delete`. */
function programAccess({ abilities }: { abilities: CallerAbilities }): ProgramAccess {
  const canWrite = can({ abilities, permission: "program:write" });
  const canRemove = can({ abilities, permission: "program:delete" });
  const canAllocate = canWrite && can({ abilities, permission: "item:read" });
  return { canEdit: canWrite, canRemove, canChangeState: canWrite, canAllocate };
}

/** Sub-lines (parts, options, add-ons) right under their line (ADR 0059, 0088). */
const nestedLines = ({ lines }: { lines: LineDto[] }) =>
  nestUnderParents({ rows: lines, keys: (line) => ({ id: line.id, parentId: line.parentLineId }) });

type ProgramHeaderProps = {
  title: string;
  canEdit: boolean;
  start: Parameters<typeof CreateLineButton>[0];
};

/** The section's title with the add buttons for a caller who may edit the program. */
function ProgramHeader({ title, canEdit, start }: ProgramHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl">{title}</h2>
      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <ExpandBundleButton {...start} />
          <CreateLineButton {...start} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * The ticket's run schedule (ADR 0022): its days in the calendar, the lines in time order with
 * their amounts and the total, edited inline, then its alternatives.
 */
export async function ProgramSection({ locale, ticket }: ProgramSectionProps) {
  const t = await getTranslations("line");
  const access = programAccess({ abilities: await getCallerAbilities() });
  const [lines, data, amounts] = await Promise.all([
    runOperation({ operation: listLines, input: { ticketId: ticket.id, limit: 100 } }),
    loadProgramData(),
    runOperation({ operation: lineAmounts, input: { ticketId: ticket.id } }),
  ]);
  if (!lines.ok && lines.error.code === "FORBIDDEN") return null;
  if (!lines.ok) {
    return <ErrorState errorKey={handleLoadError({ error: lines.error, locale })} />;
  }
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const items = nestedLines({ lines: lines.value.items });
  const start = {
    data: data.value,
    ticketId: ticket.id,
    startsAt: ticket.desiredStartsAt ?? new Date(),
  };
  return (
    <>
      <section className="grid grid-cols-1 gap-4">
        <ProgramHeader title={t("plural")} canEdit={access.canEdit} start={start} />
        <TicketDay ticketId={ticket.id} lines={items} data={data.value} />
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ProgramTable
            lines={items}
            data={data.value}
            access={access}
            amounts={amounts.ok ? amounts.value : null}
          />
        )}
      </section>
      <AlternativeGroupSection locale={locale} ticket={ticket} />
    </>
  );
}
