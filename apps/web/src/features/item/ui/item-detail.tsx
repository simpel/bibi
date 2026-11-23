import type { Locale } from "@bibi/i18n";
import { PageBands, PageContainer, PageSection } from "@bibi/ui";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { historyNode } from "@/features/audit-log/ui/history-node";
import { LastEdited } from "@/features/audit-log/ui/last-edited";
import { Link } from "@/lib/navigation";
import { itemRoute, ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { availableItemTabs, pickItemTab } from "../item-tabs";
import { loadItem } from "../load-item";
import { loadItemFormData } from "../load-item-form-data";
import { BundleOwner } from "./bundle-owner";
import { ItemActions } from "./item-actions";
import { ItemKeyFacts } from "./item-key-facts";
import { ItemPictureEditable } from "./item-picture-editable";
import { ItemTabContent } from "./item-tab-content";
import { ItemTabNav } from "./item-tab-nav";
import { ItemTitle } from "./item-title";

export type ItemDetailProps = {
  locale: Locale;
  id: string;
  /** `?tab=`: the open tab; one the item lacks falls back to its first. */
  tab?: string | undefined;
};

/**
 * The item page, laid out like the order page: a header band (picture, name, key facts, tabs)
 * and under it the open tab across the whole width; Details is the first tab. Everything is
 * edited in place.
 */
export async function ItemDetail({ locale, id, tab: tabParam }: ItemDetailProps) {
  const [common, abilities, item] = await Promise.all([
    getTranslations("common"),
    getCallerAbilities(),
    loadItem({ id }),
  ]);
  if (!item.ok) return <ErrorState errorKey={handleLoadError({ error: item.error, locale })} />;
  const [data, history] = await Promise.all([
    loadItemFormData({ customerId: item.value.customerId }),
    historyNode({ locale, entityType: "item", entityId: id }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  const type = data.value.types.find((candidate) => candidate.id === item.value.entityTypeId);
  const canEdit = can({ abilities, permission: "item:write" });
  const tabs = availableItemTabs({ type, abilities });
  const tab = pickItemTab({ value: tabParam, available: tabs });
  const shared = { item: item.value, type, data: data.value, canEdit };
  return (
    <PageBands>
      <CrumbName href={itemRoute({ id })} name={item.value.name} />
      <PageSection>
        <PageContainer width="wide" className="grid grid-cols-1 gap-4 pt-4 pb-0 sm:pt-6 sm:pb-0">
          <Link
            href={ROUTES.items}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {common("back")}
          </Link>
          <PageHeader
            title={item.value.name}
            leading={<ItemPictureEditable item={item.value} data={data.value} canEdit={canEdit} />}
            heading={<ItemTitle id={item.value.id} name={item.value.name} canEdit={canEdit} />}
            actions={<ItemActions item={item.value} abilities={abilities} history={history} />}
          />
          <LastEdited entityType="item" entityId={item.value.id} />
          {item.value.customerId ? <BundleOwner customerId={item.value.customerId} /> : null}
          <ItemKeyFacts {...shared} />
          <div className="mt-2">
            <ItemTabNav itemId={id} tabs={tabs} current={tab} />
          </div>
        </PageContainer>
      </PageSection>
      <PageSection divided>
        <PageContainer width="wide" className="grid grid-cols-1 gap-12 py-6 sm:py-8">
          <ItemTabContent locale={locale} {...shared} tab={tab} />
        </PageContainer>
      </PageSection>
    </PageBands>
  );
}
