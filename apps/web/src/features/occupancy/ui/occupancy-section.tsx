import { listOccupancies } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { CreateOccupancyButton } from "./create-occupancy-button";
import { OccupancyTable } from "./occupancy-table";

/** `timeZone`: the item's own (derived by core from its venue, ADR 0064). */
export type OccupancySectionProps = { locale: Locale; itemId: string; timeZone: string };

/** Most periods each tab shows. */
const LIMIT = 100;

/**
 * When a bookable item is taken (bookings with their setup and teardown, blocks staff add by
 * hand) in two tabs: Upcoming (not ended yet, earliest first; the default) and Past (ended,
 * latest first). Times show and are entered in the item's zone.
 */
export async function OccupancySection({ locale, itemId, timeZone }: OccupancySectionProps) {
  const now = new Date();
  const [t, abilities, upcoming, past] = await Promise.all([
    getTranslations("occupancy"),
    getCallerAbilities(),
    runOperation({ operation: listOccupancies, input: { itemId, from: now, limit: LIMIT } }),
    runOperation({
      operation: listOccupancies,
      input: { itemId, endsBefore: now, newestFirst: true, limit: LIMIT },
    }),
  ]);
  const access = {
    canEdit: can({ abilities, permission: "order:write" }),
    canRemove: can({ abilities, permission: "order:delete" }),
  };
  if (!upcoming.ok && upcoming.error.code === "FORBIDDEN") return null;
  if (!upcoming.ok) {
    return <ErrorState inline errorKey={handleLoadError({ error: upcoming.error, locale })} />;
  }
  if (!past.ok) {
    return <ErrorState inline errorKey={handleLoadError({ error: past.error, locale })} />;
  }
  const tabs = [
    { id: "upcoming", rows: upcoming.value.items, empty: t("empty") },
    { id: "past", rows: past.value.items, empty: t("tabs.emptyPast") },
  ] as const;
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl">{t("plural")}</h2>
        {access.canEdit ? <CreateOccupancyButton itemId={itemId} timeZone={timeZone} /> : null}
      </div>
      <Tabs defaultValue="upcoming" className="gap-3">
        <TabsList>
          {tabs.map(({ id, rows }) => (
            <TabsTrigger key={id} value={id}>
              {t(`tabs.${id}`, { count: rows.length })}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(({ id, rows, empty }) => (
          <TabsContent key={id} value={id}>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{empty}</p>
            ) : (
              <OccupancyTable occupancies={rows} access={access} timeZone={timeZone} list={id} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
