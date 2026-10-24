import type { Locale } from "@bibi/i18n";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadDemandLists } from "../load-demand-rows";
import { DemandList } from "./demand-list";

export type DemandsSectionProps = { locale: Locale; itemId: string };

/** What the item needs: the Resources and Staffing lists (ADR 0059), edited with `item:write`. */
export async function DemandsSection({ locale, itemId }: DemandsSectionProps) {
  const abilities = await getCallerAbilities();
  const lists = await loadDemandLists({ itemId });
  if (!lists.ok && lists.error.code === "FORBIDDEN") return null;
  if (!lists.ok) return <ErrorState errorKey={handleLoadError({ error: lists.error, locale })} />;
  const canEdit = can({ abilities, permission: "item:write" });
  const { rows, pools } = lists.value;
  return (
    <>
      <DemandList
        {...{ itemId, canEdit }}
        kind="EQUIPMENT"
        rows={rows.EQUIPMENT}
        pools={pools.EQUIPMENT}
      />
      <DemandList {...{ itemId, canEdit }} kind="PERSON" rows={rows.PERSON} pools={pools.PERSON} />
    </>
  );
}
