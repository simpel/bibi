import { getLayout, type ItemDto, listTableCombinations } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminBand } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { combinationRows, type LayoutTables, tablesOf } from "../lib/layout-tables";
import { loadSittings } from "../load-room-settings";
import { LayoutTablesCard } from "./layout-tables-card";

export type TablesSectionProps = { locale: Locale; item: ItemDto };

/** The tables and combinations of every layout a sitting uses. */
export async function TablesSection({ locale, item }: TablesSectionProps) {
  const [t, abilities, sittings] = await Promise.all([
    getTranslations("tableBooking.tables"),
    getCallerAbilities(),
    loadSittings({ roomItemId: item.id }),
  ]);
  const anchor = "tables";
  const failed = ({ error }: { error: Parameters<typeof handleLoadError>[0]["error"] }) => (
    <AdminBand anchor={anchor} title={t("title")}>
      <ErrorState errorKey={handleLoadError({ error, locale })} inline />
    </AdminBand>
  );
  if (!sittings.ok) return failed({ error: sittings.error });
  const layoutIds = [...new Set(sittings.value.map((sitting) => sitting.layoutId))];
  if (layoutIds.length === 0) return null;
  const reads = await Promise.all(
    layoutIds.map(async (layoutId) => {
      const [layout, combinations] = await Promise.all([
        runOperation({ operation: getLayout, input: { id: layoutId } }),
        runOperation({ operation: listTableCombinations, input: { layoutId } }),
      ]);
      return { layout, combinations };
    }),
  );
  const layouts: LayoutTables[] = [];
  for (const { layout, combinations } of reads) {
    if (!layout.ok) return failed({ error: layout.error });
    if (!combinations.ok) return failed({ error: combinations.error });
    layouts.push({
      layoutId: layout.value.id,
      name: layout.value.name,
      tables: tablesOf({ layout: layout.value }),
      combinations: combinationRows({ items: combinations.value.items }),
    });
  }
  const canEdit = can({ abilities, permission: "diningSetup:write" });
  return (
    <AdminBand anchor={anchor} title={t("title")} description={t("description")}>
      <div className="grid gap-8">
        {layouts.map((layout) => (
          <LayoutTablesCard
            key={`${layout.layoutId}-${layout.tables.length}`}
            layout={layout}
            canEdit={canEdit}
          />
        ))}
      </div>
    </AdminBand>
  );
}
