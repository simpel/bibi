import { getEntityType, getItemState, listItemStates } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ItemStateDangerArea } from "./item-state-danger-area";
import { ItemStateForm } from "./item-state-form";

export type ItemStatePageProps = {
  locale: Locale;
  /** Create: the item type id (from `?type=`). Update: the state id. */
  mode: { create: string } | { update: string };
};

/**
 * `/new/item-state` and `/admin/item-states/[id]/update`: the form on a page of its own; an
 * existing state's danger area is last.
 */
export async function ItemStatePage({ locale, mode }: ItemStatePageProps) {
  const [t, abilities, state] = await Promise.all([
    getTranslations("itemState"),
    getCallerAbilities(),
    "update" in mode
      ? runOperation({ operation: getItemState, input: { id: mode.update } })
      : undefined,
  ]);
  if (state && !state.ok)
    return <ErrorState errorKey={handleLoadError({ error: state.error, locale })} />;
  const typeId = state?.ok ? state.value.entityTypeId : "create" in mode ? mode.create : "";
  const editing = state?.ok ? state.value : undefined;
  const canArchive = editing !== undefined && can({ abilities, permission: "pipeline:delete" });
  const [type, siblings] = await Promise.all([
    runOperation({ operation: getEntityType, input: { id: typeId } }),
    canArchive
      ? runOperation({ operation: listItemStates, input: { entityTypeId: typeId, limit: 100 } })
      : undefined,
  ]);
  if (!type.ok) return <ErrorState errorKey={handleLoadError({ error: type.error, locale })} />;
  return (
    <>
      {editing && "update" in mode ? (
        <CrumbName href={`/admin/item-states/${mode.update}/update`} name={editing.name} />
      ) : null}
      <FormPageShell
        title={editing ? t("edit") : t("create")}
        description={
          editing ? t("editDescription") : t("createDescription", { type: type.value.name })
        }
      >
        <ItemStateForm
          type={{ id: type.value.id, bookable: type.value.capabilities.includes("BOOKABLE") }}
          state={editing}
        />
      </FormPageShell>
      {editing && siblings?.ok ? (
        <ItemStateDangerArea state={editing} states={siblings.value.items} />
      ) : null}
    </>
  );
}
