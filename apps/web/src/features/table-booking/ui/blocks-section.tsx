import { getLayout, type ItemDto, listTableBlocks } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminBand } from "@/components/admin/admin-section";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { BlockRow } from "../lib/block-rows";
import { dayOf } from "../lib/edge-time";
import { tablesOf } from "../lib/layout-tables";
import { loadSittings } from "../load-room-settings";
import { BlocksTable } from "./blocks-table";
import { CreateBlockButton } from "./create-block-button";

const YEAR_MS = 366 * 24 * 60 * 60 * 1000;

export type BlocksSectionProps = { locale: Locale; item: ItemDto };

/** Every held-back table of the room from now on: plan ahead, release, or hold more. */
export async function BlocksSection({ locale, item }: BlocksSectionProps) {
  const [t, abilities, sittings, format] = await Promise.all([
    getTranslations("tableBooking.blocks"),
    getCallerAbilities(),
    loadSittings({ roomItemId: item.id }),
    getDateTimeFormat(),
  ]);
  const anchor = "blocks";
  const failed = ({ error }: { error: Parameters<typeof handleLoadError>[0]["error"] }) => (
    <AdminBand anchor={anchor} title={t("title")}>
      <ErrorState errorKey={handleLoadError({ error, locale })} inline />
    </AdminBand>
  );
  if (!sittings.ok) return failed({ error: sittings.error });
  const layoutIds = [...new Set(sittings.value.map((sitting) => sitting.layoutId))];
  if (layoutIds.length === 0) return null;
  const from = new Date();
  const to = new Date(from.getTime() + YEAR_MS);
  const reads = await Promise.all(
    layoutIds.map(async (layoutId) => {
      const [layout, blocks] = await Promise.all([
        runOperation({ operation: getLayout, input: { id: layoutId } }),
        runOperation({ operation: listTableBlocks, input: { layoutId, from, to } }),
      ]);
      return { layout, blocks };
    }),
  );
  const tables = new Map<string, { id: string; label: string; seats: number }>();
  const rows: BlockRow[] = [];
  const timeZone = item.timeZone;
  for (const { layout, blocks } of reads) {
    if (!layout.ok) return failed({ error: layout.error });
    if (!blocks.ok) return failed({ error: blocks.error });
    for (const table of tablesOf({ layout: layout.value })) tables.set(table.id, table);
    for (const block of blocks.value.items) {
      const sameDay =
        dayOf({ instant: block.startsAt, timeZone }) === dayOf({ instant: block.endsAt, timeZone });
      const day = ({ instant }: { instant: Date }) =>
        format.date({ instant, timeZone, weekday: "short" });
      rows.push({
        id: block.id,
        label: block.label ?? "–",
        kind: block.kind,
        startsAt: block.startsAt.toISOString(),
        period: sameDay
          ? `${day({ instant: block.startsAt })} ${format.timeRange({ start: block.startsAt, end: block.endsAt, timeZone })}`
          : `${day({ instant: block.startsAt })} ${format.time({ instant: block.startsAt, timeZone })} – ${day({ instant: block.endsAt })} ${format.time({ instant: block.endsAt, timeZone })}`,
        note: block.note ?? "",
      });
    }
  }
  rows.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const choices = [...tables.values()].map(({ id, label, seats }) => ({ id, label, seats }));
  const canEdit = can({ abilities, permission: "reservation:write" });
  const create = canEdit ? (
    <CreateBlockButton
      roomItemId={item.id}
      date={dayOf({ instant: from, timeZone })}
      tables={choices}
    />
  ) : undefined;
  return (
    <AdminBand anchor={anchor} title={t("title")} description={t("description")} actions={create}>
      {rows.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <BlocksTable rows={rows} canEdit={canEdit} />
      )}
    </AdminBand>
  );
}
