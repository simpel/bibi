import { getItem } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { itemRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadItemFormData } from "../load-item-form-data";
import { ItemUpdateForm } from "./item-update-form";

export type ItemUpdateProps = { locale: Locale; id: string };

/** `/items/[id]/update`: edit the item on a page of its own. */
export async function ItemUpdate({ locale, id }: ItemUpdateProps) {
  const t = await getTranslations("item");
  const item = await runOperation({ operation: getItem, input: { id } });
  if (!item.ok) return <ErrorState errorKey={handleLoadError({ error: item.error, locale })} />;
  const data = await loadItemFormData({ customerId: item.value.customerId });
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell
      backHref={itemRoute({ id })}
      title={t("edit")}
      description={t("editDescription")}
    >
      <ItemUpdateForm item={item.value} data={data.value} />
    </FormPageShell>
  );
}
