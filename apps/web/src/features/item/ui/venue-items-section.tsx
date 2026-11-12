import { summarizeItems } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Card } from "@bibi/ui";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Link } from "@/lib/navigation";
import { venueItemsRoute } from "@/lib/routes";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";

export type VenueItemsSectionProps = { locale: Locale; venueId: string };

type TypeRow = { typeId: string; name: string; count: number; sampleNames: string[] };

/** A venue's items counted per item type (by its plural name); each row opens `/venues/<id>/items/<typeId>`. */
export async function VenueItemsSection({ locale, venueId }: VenueItemsSectionProps) {
  const [t, items, summary, types] = await Promise.all([
    getTranslations("venue"),
    getTranslations("item"),
    runOperation({ operation: summarizeItems, input: { venueId } }),
    loadEntityTypesOf({ base: "ITEM" }),
  ]);
  if (!summary.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: summary.error, locale })} />;
  if (!types.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: types.error, locale })} />;
  const names = new Map(types.value.items.map((type) => [type.id, type.pluralName ?? type.name]));
  const rows: TypeRow[] = summary.value.types.map((type) => ({
    typeId: type.entityTypeId,
    name: names.get(type.entityTypeId) ?? type.entityTypeId,
    count: type.count,
    sampleNames: type.sampleNames,
  }));
  return (
    <section className="grid gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl">
          {items("plural")}{" "}
          <span className="text-base text-muted-foreground">{summary.value.total}</span>
        </h2>
        {rows.length > 0 ? (
          <Link
            href={venueItemsRoute({ id: venueId })}
            className="flex items-center gap-1 text-sm hover:underline"
          >
            {t("items.showAll")}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <EmptyState title={t("itemsEmpty")} />
      ) : (
        <Card className="gap-0 overflow-hidden p-0">
          <ul className="divide-y">
            {rows.map((row) => (
              <TypeRowLink key={row.typeId} venueId={venueId} row={row} more={t} />
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

type TypeRowLinkProps = {
  venueId: string;
  row: TypeRow;
  more: Awaited<ReturnType<typeof getTranslations<"venue">>>;
};

function TypeRowLink({ venueId, row, more }: TypeRowLinkProps) {
  const rest = row.count - row.sampleNames.length;
  const sample = [
    ...row.sampleNames,
    ...(rest > 0 ? [more("items.more", { count: rest })] : []),
  ].join(", ");
  return (
    <li>
      <Link
        href={venueItemsRoute({ id: venueId, typeId: row.typeId })}
        className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
      >
        <span className="grid min-w-0">
          <span className="font-medium">{row.name}</span>
          <span className="truncate text-sm text-muted-foreground">{sample}</span>
        </span>
        <span className="tabular-nums">{row.count}</span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}
