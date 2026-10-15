import { getItem } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { OccupancySection } from "../../occupancy/ui/occupancy-section";
import { loadItemFormData } from "../load-item-form-data";
import { ItemActions } from "./item-actions";
import { ItemBehaviours } from "./item-behaviours";
import { ItemFacts } from "./item-facts";

export type ItemDetailProps = { locale: Locale; id: string };

/** Item detail page body: facts of the item with edit and archive; occupancy if bookable. */
export async function ItemDetail({ locale, id }: ItemDetailProps) {
  const common = await getTranslations("common");
  const { itemWrite } = await getCallerAbilities();
  const [item, data] = await Promise.all([
    runOperation({ operation: getItem, input: { id } }),
    loadItemFormData(),
  ]);
  if (!item.ok) return <ErrorState errorKey={handleLoadError({ error: item.error, locale })} />;
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const type = data.value.types.find((candidate) => candidate.id === item.value.entityTypeId);
  const actions = itemWrite ? <ItemActions item={item.value} data={data.value} /> : undefined;
  return (
    <div className="grid gap-6">
      <Link
        href={ROUTES.items}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader
        title={item.value.name}
        description={item.value.description ?? undefined}
        actions={actions}
      />
      <ItemFacts item={item.value} type={type} data={data.value} />
      <ItemBehaviours item={item.value} data={data.value} locale={locale} />
      {type?.behaviours.includes("BOOKABLE") ? (
        <OccupancySection locale={locale} itemId={item.value.id} />
      ) : null}
    </div>
  );
}
