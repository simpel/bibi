import { listSheetDefinitions, listSheets, type TicketDto } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { SheetPanel } from "./sheet-panel";

export type SheetSectionProps = { locale: Locale; ticket: TicketDto };

/**
 * The ticket's sheets (ADR 0021): per sheet definition the newest version, with ★ on the rows
 * changed since the last sent one. Versions go out only from the confirmed phase (`sheet.send`).
 */
export async function SheetSection({ locale, ticket }: SheetSectionProps) {
  const abilities = await getCallerAbilities();
  const t = await getTranslations("sheet");
  const [definitions, sheets] = await Promise.all([
    runOperation({ operation: listSheetDefinitions, input: { limit: 100 } }),
    runOperation({ operation: listSheets, input: { ticketId: ticket.id, limit: 100 } }),
  ]);
  for (const result of [definitions, sheets]) {
    if (!result.ok && result.error.code === "FORBIDDEN") return null;
    if (!result.ok)
      return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  }
  if (!definitions.ok || !sheets.ok) return null;
  return (
    <section className="grid gap-4">
      <h2 className="text-lg font-semibold">{t("plural")}</h2>
      {definitions.value.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        definitions.value.items.map((definition) => (
          <SheetPanel
            key={definition.id}
            ticketId={ticket.id}
            definition={definition}
            sheet={
              sheets.value.items.find((sheet) => sheet.sheetDefinitionId === definition.id) ?? null
            }
            canGenerate={can({ abilities, permission: "sheet:write" })}
            canSend={can({ abilities, permission: "sheet:write" })}
          />
        ))
      )}
    </section>
  );
}
