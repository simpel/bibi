import {
  getFloorPlan,
  getSetupLayout,
  listFloorElementKinds,
  listSetups,
  type SetupLayoutDto,
} from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { redirect } from "@/lib/navigation";
import { itemRoute } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadItem } from "../../item/load-item";
import { layoutsRoute, PLAN_TAB } from "../layouts-path";
import { ImportKindsButton } from "./import-kinds-button";
import { LayoutEditor } from "./layout-editor";

export type LayoutsPageProps = {
  locale: Locale;
  org: string;
  itemId: string;
  tab: string | undefined;
};

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="p-4 sm:p-6">{children}</div>;
}

/**
 * `/items/{id}/layouts/{tab}` (a canvas page, ADR 0038, 0099): the floor plan and each setup's
 * layout, one tab per URL. Five reads: the item, its plan, the setup names, the library and the
 * open layout.
 */
export async function LayoutsPage({ locale, org, itemId, tab }: LayoutsPageProps) {
  const t = await getTranslations("floorPlan");
  const [item, plan, setups, kinds, abilities] = await Promise.all([
    loadItem({ id: itemId }),
    runOperation({ operation: getFloorPlan, input: { itemId } }),
    runOperation({ operation: listSetups, input: { limit: 100 } }),
    runOperation({ operation: listFloorElementKinds, input: { limit: 100 } }),
    getCallerAbilities(),
  ]);
  for (const result of [item, plan, setups, kinds]) {
    if (!result.ok)
      return (
        <Frame>
          <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />
        </Frame>
      );
  }
  if (!item.ok || !plan.ok || !setups.ok || !kinds.ok) return null;
  const names = new Map(setups.value.items.map((setup) => [setup.id, setup.name]));
  const first = plan.value.layouts[0]?.setupId ?? PLAN_TAB;
  if (!tab) redirect({ org, locale, href: layoutsRoute({ itemId, tab: first }) });
  const current = tab ?? first;
  const summary = plan.value.layouts.find((layout) => layout.setupId === current);
  if (current !== PLAN_TAB && !summary) redirect({ org, locale, href: layoutsRoute({ itemId }) });
  const canEdit = can({ abilities, permission: "item:write" });
  const crumbs = <CrumbName href={itemRoute({ id: itemId })} name={item.value.name} />;
  if (kinds.value.items.length === 0) {
    const action = can({ abilities, permission: "configuration:write" }) ? (
      <ImportKindsButton />
    ) : (
      <Button variant="outline" disabled>
        {t("noKinds.askAdmin")}
      </Button>
    );
    return (
      <Frame>
        {crumbs}
        <EmptyState
          title={t("noKinds.title")}
          description={t("noKinds.description")}
          action={action}
        />
      </Frame>
    );
  }
  let layout: SetupLayoutDto | null = null;
  if (summary) {
    const read = await runOperation({
      operation: getSetupLayout,
      input: { itemId, setupId: summary.setupId },
    });
    if (!read.ok)
      return (
        <Frame>
          <ErrorState errorKey={handleLoadError({ error: read.error, locale })} />
        </Frame>
      );
    layout = read.value;
  }
  const tabs = [
    { key: PLAN_TAB, label: t("tabsPlan"), capacity: null },
    ...plan.value.layouts.map((each) => ({
      key: each.setupId,
      label: names.get(each.setupId) ?? "–",
      capacity: each.effectiveCapacity,
    })),
  ];
  const { widthCm, depthCm, outline, minAisleCm } = plan.value;
  const version = layout ? layout.version : plan.value.version;
  return (
    <>
      {crumbs}
      <LayoutEditor
        key={`${current}-${version}`}
        itemId={itemId}
        tab={current}
        tabs={tabs}
        setup={
          layout && summary
            ? {
                id: summary.setupId,
                name: names.get(summary.setupId) ?? "–",
                capacity: layout.capacity,
              }
            : null
        }
        room={{ widthCm, depthCm, outline, minAisleCm }}
        fixed={layout ? plan.value.elements : []}
        elements={layout ? layout.elements : plan.value.elements}
        version={version}
        kinds={kinds.value.items}
        canEdit={canEdit}
      />
    </>
  );
}
