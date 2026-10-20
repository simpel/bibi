import { getItem } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { WithHistory } from "@/features/audit-log/ui/with-history";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { OccupancySection } from "../../occupancy/ui/occupancy-section";
import { loadItemFormData } from "../load-item-form-data";
import { BundleOwner } from "./bundle-owner";
import { ItemActions } from "./item-actions";
import { ItemCapabilities } from "./item-capabilities";
import { ItemFacts } from "./item-facts";
import { ItemResolutionSection } from "./item-resolution-section";

export type ItemDetailProps = { locale: Locale; id: string };

/** Item detail page body: facts with edit and archive, contents, occupancy and history. */
export async function ItemDetail({ locale, id }: ItemDetailProps) {
  const common = await getTranslations("common");
  const abilities = await getCallerAbilities();
  const item = await runOperation({ operation: getItem, input: { id } });
  if (!item.ok) return <ErrorState errorKey={handleLoadError({ error: item.error, locale })} />;
  const data = await loadItemFormData({ customerId: item.value.customerId });
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const type = data.value.types.find((candidate) => candidate.id === item.value.entityTypeId);
  const actions = <ItemActions item={item.value} abilities={abilities} />;
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
      {item.value.customerId ? <BundleOwner customerId={item.value.customerId} /> : null}
      <WithHistory locale={locale} entityType="item" entityId={item.value.id}>
        <ItemFacts item={item.value} type={type} data={data.value} />
        <ItemCapabilities item={item.value} data={data.value} locale={locale} />
        {type?.capabilities.includes("BUNDLE") ? (
          <ItemResolutionSection locale={locale} itemId={item.value.id} />
        ) : null}
        {type?.capabilities.includes("BOOKABLE") &&
        can({ abilities, permission: "ticket:read" }) ? (
          <OccupancySection locale={locale} itemId={item.value.id} />
        ) : null}
      </WithHistory>
    </div>
  );
}
