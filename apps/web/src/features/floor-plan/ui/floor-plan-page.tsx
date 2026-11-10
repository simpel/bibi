import type { Locale } from "@bibi/i18n";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { itemRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadRoom } from "../load-room";
import { LayoutEditor } from "./layout-editor";
import { NoKinds } from "./no-kinds";

export type FloorPlanPageProps = { locale: Locale; itemId: string };

/**
 * `/items/{id}/floor-plan` (a canvas page, ADR 0038, 0102): the room itself, its walls, doors,
 * windows and fixed parts, shared by every layout of the item.
 */
export async function FloorPlanPage({ locale, itemId }: FloorPlanPageProps) {
  const room = await loadRoom({ itemId });
  if (!room.ok) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState errorKey={handleLoadError({ error: room.error, locale })} />
      </div>
    );
  }
  const { item, plan, kinds, canEdit, canImportKinds } = room.value;
  const crumbs = <CrumbName href={itemRoute({ id: itemId })} name={item.name} />;
  if (kinds.length === 0) return <NoKinds crumbs={crumbs} canImport={canImportKinds} />;
  const { widthCm, depthCm, outline, minAisleCm } = plan;
  return (
    <>
      {crumbs}
      <LayoutEditor
        key={plan.version}
        itemId={itemId}
        layout={null}
        tabs={[]}
        creating={null}
        room={{ widthCm, depthCm, outline, minAisleCm }}
        fixed={[]}
        elements={plan.elements}
        version={plan.version}
        kinds={kinds}
        canEdit={canEdit}
      />
    </>
  );
}
