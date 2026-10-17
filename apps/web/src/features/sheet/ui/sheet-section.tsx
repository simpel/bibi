import { type BookingDto, listSheetDefinitions, listSheets } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { SheetPanel } from "./sheet-panel";

export type SheetSectionProps = { locale: Locale; booking: BookingDto };

/**
 * The booking's sheets (ADR 0021): per sheet definition the newest version, with ★ on the rows
 * changed since the last sent one. Versions go out only from the confirmed phase (`sheet.send`).
 */
export async function SheetSection({ locale, booking }: SheetSectionProps) {
  const { sheetWrite } = await getCallerAbilities();
  const t = await getTranslations("sheet");
  const [definitions, sheets] = await Promise.all([
    runOperation({ operation: listSheetDefinitions, input: { limit: 100 } }),
    runOperation({ operation: listSheets, input: { bookingId: booking.id, limit: 100 } }),
  ]);
  for (const result of [definitions, sheets]) {
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
            bookingId={booking.id}
            definition={definition}
            sheet={
              sheets.value.items.find((sheet) => sheet.sheetDefinitionId === definition.id) ?? null
            }
            canWrite={sheetWrite}
          />
        ))
      )}
    </section>
  );
}
