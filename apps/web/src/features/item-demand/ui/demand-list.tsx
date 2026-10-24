import { getTranslations } from "next-intl/server";
import { CreateDemandButton } from "./create-demand-button";
import { DemandTable } from "./demand-table";
import type { DemandListKind, DemandRow, PoolOption } from "./demand-types";

export type DemandListProps = {
  itemId: string;
  kind: DemandListKind;
  rows: DemandRow[];
  pools: PoolOption[];
  canEdit: boolean;
};

/** One labelled list: Resources (equipment) or Staffing (people), with its add button. */
export async function DemandList({ itemId, kind, rows, pools, canEdit }: DemandListProps) {
  const t = await getTranslations("itemDemand");
  const list = kind === "PERSON" ? "staffing" : "resources";
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t(`lists.${list}`)}</h2>
        {canEdit && pools.length > 0 ? <CreateDemandButton itemId={itemId} pools={pools} /> : null}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(`empty.${list}`)}</p>
      ) : (
        <DemandTable kind={kind} rows={rows} canEdit={canEdit} emptyText={t(`empty.${list}`)} />
      )}
    </section>
  );
}
