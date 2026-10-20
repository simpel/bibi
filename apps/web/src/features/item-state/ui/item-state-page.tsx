import { getEntityType, getItemState } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { ItemStateForm } from "./item-state-form";

export type ItemStatePageProps = {
  locale: Locale;
  /** Create: the item type id (from `?type=`). Update: the state id. */
  mode: { create: string } | { update: string };
};

/** `/new/item-state` and `/settings/item-states/[id]/update`: the form on a page of its own. */
export async function ItemStatePage({ locale, mode }: ItemStatePageProps) {
  const t = await getTranslations("itemState");
  const state =
    "update" in mode
      ? await runOperation({ operation: getItemState, input: { id: mode.update } })
      : undefined;
  if (state && !state.ok)
    return <ErrorState errorKey={handleLoadError({ error: state.error, locale })} />;
  const typeId = state?.ok ? state.value.entityTypeId : "create" in mode ? mode.create : "";
  const type = await runOperation({ operation: getEntityType, input: { id: typeId } });
  if (!type.ok) return <ErrorState errorKey={handleLoadError({ error: type.error, locale })} />;
  const editing = state?.ok ? state.value : undefined;
  return (
    <FormPageShell
      backHref={ROUTES.settingsItemStates}
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
  );
}
