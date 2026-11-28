import { getLayout, type ItemDto, type LayoutDto, listTableCombinations } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminBand } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { floorPlanData } from "@/features/reservation/lib/floor-data";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { combinationRows, tablesOf } from "../lib/layout-tables";
import type { SittingTables } from "../lib/sitting-tables";
import { loadSittings } from "../load-room-settings";
import { SittingTablesTabs } from "./sitting-tables-tabs";

export type TablesSectionProps = { locale: Locale; item: ItemDto };

/** The tables of each sitting: its floor plan to tap, its combinations, its layout. */
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
      return { layoutId, layout, combinations };
    }),
  );
  const layouts = new Map<
    string,
    { layout: LayoutDto; combinations: SittingTables["combinations"] }
  >();
  for (const { layoutId, layout, combinations } of reads) {
    if (!layout.ok) return failed({ error: layout.error });
    if (!combinations.ok) return failed({ error: combinations.error });
    layouts.set(layoutId, {
      layout: layout.value,
      combinations: combinationRows({ items: combinations.value.items }),
    });
  }
  const data: SittingTables[] = sittings.value.flatMap((sitting) => {
    const found = layouts.get(sitting.layoutId);
    if (!found) return [];
    const tables = tablesOf({ layout: found.layout });
    return [
      {
        sittingId: sitting.id,
        sittingName: sitting.name,
        layoutId: sitting.layoutId,
        layoutName: found.layout.name,
        plan: floorPlanData({ layout: found.layout, tableName: (label) => label }),
        tables,
        combinations: found.combinations,
        signature: tables
          .map(
            (table) =>
              `${table.id}:${table.label}:${table.minCovers}:${table.maxCovers}:${table.onlineBookable}`,
          )
          .join("|"),
      },
    ];
  });
  return (
    <AdminBand anchor={anchor} title={t("title")} description={t("description")}>
      <SittingTablesTabs
        itemId={item.id}
        sittings={data}
        layouts={item.layouts.map((layout) => ({ id: layout.layoutId, name: layout.name }))}
        canEdit={can({ abilities, permission: "diningSetup:write" })}
      />
    </AdminBand>
  );
}
