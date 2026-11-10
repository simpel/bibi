import { getSetupLayout, type SetupLayoutDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { redirect } from "@/lib/navigation";
import { itemRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { floorPlanRoute, layoutsRoute, PLAN_TAB } from "../layouts-path";
import { loadRoom } from "../load-room";
import { CreateLayoutButton } from "./create-layout-button";
import { LayoutEditor } from "./layout-editor";
import { NoKinds } from "./no-kinds";

export type LayoutsPageProps = {
  locale: Locale;
  org: string;
  itemId: string;
  layoutId: string | undefined;
};

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="p-4 sm:p-6">{children}</div>;
}

/**
 * `/items/{id}/layouts/{layoutId}` (a canvas page, ADR 0038, 0099, 0102): one layout of the item,
 * with a tab per layout. The room's read and the layout's read run one after the other only
 * because the first layout's id comes from the room.
 */
export async function LayoutsPage({ locale, org, itemId, layoutId }: LayoutsPageProps) {
  const t = await getTranslations("floorPlan");
  if (layoutId === PLAN_TAB) redirect({ org, locale, href: floorPlanRoute({ itemId }) });
  const room = await loadRoom({ itemId });
  if (!room.ok) {
    return (
      <Frame>
        <ErrorState errorKey={handleLoadError({ error: room.error, locale })} />
      </Frame>
    );
  }
  const { item, plan, kinds, setupNames, canEdit, canImportKinds } = room.value;
  const crumbs = <CrumbName href={itemRoute({ id: itemId })} name={item.name} />;
  if (kinds.length === 0) return <NoKinds crumbs={crumbs} canImport={canImportKinds} />;
  const setups = plan.setups.map(({ setupId }) => ({
    id: setupId,
    name: setupNames.get(setupId) ?? "–",
  }));
  const creating = { setups, layouts: plan.layouts.map(({ id, name }) => ({ id, name })) };
  const first = plan.layouts[0];
  if (!layoutId && first)
    redirect({ org, locale, href: layoutsRoute({ itemId, layoutId: first.id }) });
  const summary = plan.layouts.find((layout) => layout.id === layoutId);
  if (!summary) {
    if (layoutId) redirect({ org, locale, href: layoutsRoute({ itemId }) });
    return (
      <Frame>
        {crumbs}
        <EmptyState
          title={t("noLayouts.title")}
          description={t(setups.length ? "noLayouts.description" : "noLayouts.noSetups")}
          action={
            canEdit && setups.length ? <CreateLayoutButton itemId={itemId} {...creating} /> : null
          }
        />
      </Frame>
    );
  }
  const read = await runOperation({ operation: getSetupLayout, input: { id: summary.id } });
  if (!read.ok) {
    return (
      <Frame>
        <ErrorState errorKey={handleLoadError({ error: read.error, locale })} />
      </Frame>
    );
  }
  const layout: SetupLayoutDto = read.value;
  const tabs = plan.layouts.map((each) => ({
    key: each.id,
    label: each.name,
    hint: setupNames.get(each.setupId) ?? null,
    seats: each.seatCount,
  }));
  const { widthCm, depthCm, outline, minAisleCm } = plan;
  return (
    <>
      {crumbs}
      <LayoutEditor
        key={`${layout.id}-${layout.version}`}
        itemId={itemId}
        layout={{
          id: layout.id,
          name: layout.name,
          setupName: setupNames.get(layout.setupId) ?? "–",
          capacity: layout.capacity,
        }}
        tabs={tabs}
        creating={creating}
        room={{ widthCm, depthCm, outline, minAisleCm }}
        fixed={plan.elements}
        elements={layout.elements}
        version={layout.version}
        kinds={kinds}
        canEdit={canEdit}
      />
    </>
  );
}
