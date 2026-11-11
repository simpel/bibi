import { listItems } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadVenue } from "@/features/venue/load-venue";
import { venueItemsRoute, venueRoute } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadItemFormData } from "../load-item-form-data";
import { ItemTable } from "./item-table";

export type VenueItemsProps = {
  locale: Locale;
  venueId: string;
  /** Only items of this type (`/venues/<id>/items/<typeId>`). */
  typeId?: string | undefined;
};

const LIMIT = 100;

/** A venue's items, all or of one type: the page the venue's items summary links to. */
export async function VenueItems({ locale, venueId, typeId }: VenueItemsProps) {
  const [t, venue, data, page, abilities] = await Promise.all([
    getTranslations("venue"),
    loadVenue({ id: venueId }),
    loadItemFormData(),
    runOperation({
      operation: listItems,
      input: { venueId, limit: LIMIT, ...(typeId ? { entityTypeId: typeId } : {}) },
    }),
    getCallerAbilities(),
  ]);
  for (const result of [venue, data, page]) {
    if (!result.ok)
      return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  }
  if (!venue.ok || !data.ok || !page.ok) return null;
  const type = typeId ? data.value.types.find((entry) => entry.id === typeId) : undefined;
  if (typeId && !type) notFound();
  const name = venue.value.name;
  const typeName = type ? (type.pluralName ?? type.name) : undefined;
  return (
    <div className="grid gap-6">
      <CrumbName href={venueRoute({ id: venueId })} name={name} />
      {type ? (
        <CrumbName href={venueItemsRoute({ id: venueId, typeId: type.id })} name={typeName ?? ""} />
      ) : null}
      <PageHeader
        title={typeName ?? t("items.pageTitle", { venue: name })}
        description={
          typeName
            ? t("items.typeDescription", { type: typeName, venue: name })
            : t("items.pageDescription")
        }
      />
      {page.value.items.length === 0 ? (
        <EmptyState title={t("itemsEmpty")} />
      ) : (
        <ItemTable
          items={page.value.items}
          types={data.value.types}
          venues={data.value.venues}
          venuesHidden={data.value.venuesHidden}
          canEdit={can({ abilities, permission: "item:write" })}
          withControls
        />
      )}
    </div>
  );
}
