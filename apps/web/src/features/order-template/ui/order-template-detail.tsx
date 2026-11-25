import type { Locale } from "@bibi/i18n";
import { PageBands, PageContainer, PageSection } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { DeferredSection } from "@/components/states/deferred-section";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { PageTabNav } from "@/components/states/page-tab-nav";
import { EntityHistory } from "@/features/audit-log/ui/entity-history";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { loadOrderTemplate } from "../load-order-template";
import { loadOrderTemplateData } from "../load-order-template-data";
import { orderTemplateHref } from "../template-route";
import { availableTemplateTabs, pickTemplateTab } from "../template-tabs";
import { OrderTemplateDangerArea } from "./order-template-danger-area";
import { TemplateHeaderActions } from "./template-header-actions";
import { TemplateKeyFacts } from "./template-key-facts";
import { TemplateLinesSection } from "./template-lines-section";
import { TemplatePictureEditable } from "./template-picture-editable";
import { TemplateTitle } from "./template-title";

export type OrderTemplateDetailProps = {
  locale: Locale;
  id: string;
  /** `?tab=`: the open tab; one the caller lacks falls back to Lines. */
  tab?: string | undefined;
};

/**
 * A booking template's page, laid out like the item page: a header band (picture, name, key
 * facts, tabs) and the open tab under it. Everything is edited in place; lines in a dialog.
 */
export async function OrderTemplateDetail({ locale, id, tab: tabParam }: OrderTemplateDetailProps) {
  const [t, common, abilities, template, data] = await Promise.all([
    getTranslations("orderTemplate"),
    getTranslations("common"),
    getCallerAbilities(),
    loadOrderTemplate({ id }),
    loadOrderTemplateData(),
  ]);
  const failed = !template.ok ? template : !data.ok ? data : null;
  if (failed) return <ErrorState errorKey={handleLoadError({ error: failed.error, locale })} />;
  if (!template.ok || !data.ok) return null;
  const canEdit = can({ abilities, permission: "orderTemplate:write" });
  const canOrder = can({ abilities, permission: "order:write" });
  const tabs = availableTemplateTabs({ abilities });
  const tab = pickTemplateTab({ value: tabParam, available: tabs });
  const shared = { template: template.value, data: data.value, canEdit };
  return (
    <PageBands>
      <CrumbName href={orderTemplateHref({ id })} name={template.value.name} />
      <PageSection>
        <PageContainer width="wide" className="grid grid-cols-1 gap-4 pt-4 pb-0 sm:pt-6 sm:pb-0">
          <PageHeader
            title={template.value.name}
            leading={<TemplatePictureEditable {...shared} />}
            heading={<TemplateTitle id={id} name={template.value.name} canEdit={canEdit} />}
            actions={<TemplateHeaderActions template={template.value} canOrder={canOrder} />}
          />
          <TemplateKeyFacts {...shared} />
          <div className="mt-2">
            <PageTabNav
              base={orderTemplateHref({ id })}
              label={t("tabs.label")}
              current={tab}
              tabs={tabs.map((tabId) => ({
                id: tabId,
                label: tabId === "danger" ? common("dangerArea") : t(`tabs.${tabId}`),
              }))}
            />
          </div>
        </PageContainer>
      </PageSection>
      <PageSection divided>
        <PageContainer width="wide" className="grid grid-cols-1 gap-12 py-6 sm:py-8">
          {tab === "lines" ? <TemplateLinesSection {...shared} /> : null}
          {tab === "history" ? (
            <section className="grid grid-cols-1 gap-4">
              <h2 className="text-xl">{t("tabs.history")}</h2>
              <DeferredSection>
                <EntityHistory locale={locale} entityType="orderTemplate" entityId={id} />
              </DeferredSection>
            </section>
          ) : null}
          {tab === "danger" ? <OrderTemplateDangerArea template={template.value} /> : null}
        </PageContainer>
      </PageSection>
    </PageBands>
  );
}
