import type { EntityTypeDto, ItemDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { DeferredSection } from "@/components/states/deferred-section";
import { EntityHistory } from "@/features/audit-log/ui/entity-history";
import { LastEdited } from "@/features/audit-log/ui/last-edited";
import { LayoutsSection } from "../../floor-plan/ui/layouts-section";
import { DemandsSection } from "../../item-demand/ui/demands-section";
import { OccupancySection } from "../../occupancy/ui/occupancy-section";
import { hoursKind, type ItemTab } from "../item-tabs";
import { hasCapability } from "./has-capability";
import { ItemDangerArea } from "./item-danger-area";
import { ItemDetailsSection } from "./item-details-section";
import type { ItemFormData } from "./item-form-data";
import { ItemHoursSection } from "./item-hours-section";
import { ItemResolutionSection } from "./item-resolution-section";
import { ItemSections } from "./item-sections";

export type ItemTabContentProps = {
  locale: Locale;
  item: ItemDto;
  type: EntityTypeDto | undefined;
  data: ItemFormData;
  canEdit: boolean;
  tab: ItemTab;
};

/** The open tab's sections; each that reads its own data streams in (ADR 0097). */
export async function ItemTabContent({
  locale,
  item,
  type,
  data,
  canEdit,
  tab,
}: ItemTabContentProps) {
  const venueName = data.venues.find(({ id }) => id === item.venueId)?.name ?? "";
  switch (tab) {
    case "details":
      return (
        <>
          <ItemDetailsSection item={item} type={type} data={data} canEdit={canEdit} />
          {/* A room's setup and teardown belong to its layouts (ADR 0103), not the room. */}
          {hasCapability({ type, capability: "SETUPS" }) ? null : (
            <ItemSections item={item} type={type} data={data} canEdit={canEdit} show="buffers" />
          )}
          {/* Who edited it last is a footnote of the details, not the header. */}
          <DeferredSection>
            <LastEdited entityType="item" entityId={item.id} />
          </DeferredSection>
        </>
      );
    case "layouts":
      return (
        <DeferredSection>
          <LayoutsSection locale={locale} itemId={item.id} canEdit={canEdit} />
        </DeferredSection>
      );
    case "occupancy":
      return (
        <DeferredSection>
          <OccupancySection locale={locale} itemId={item.id} timeZone={item.timeZone} />
        </DeferredSection>
      );
    case "contents":
      return (
        <>
          <ItemSections item={item} type={type} data={data} canEdit={canEdit} show="contents" />
          {hasCapability({ type, capability: "BUNDLE" }) ? (
            <DeferredSection>
              <ItemResolutionSection locale={locale} itemId={item.id} />
            </DeferredSection>
          ) : null}
        </>
      );
    case "resources":
      return (
        <DeferredSection>
          <DemandsSection locale={locale} itemId={item.id} />
        </DeferredSection>
      );
    case "hours":
      return (
        <DeferredSection>
          <ItemHoursSection
            locale={locale}
            itemId={item.id}
            kind={hoursKind({ type })}
            venue={item.venueId ? { id: item.venueId, name: venueName } : null}
          />
        </DeferredSection>
      );
    case "history":
      return (
        <section className="grid grid-cols-1 gap-4">
          <h2 className="text-xl">{(await getTranslations("auditLog"))("history")}</h2>
          <DeferredSection>
            <EntityHistory locale={locale} entityType="item" entityId={item.id} />
          </DeferredSection>
        </section>
      );
    case "danger":
      return <ItemDangerArea item={item} />;
  }
}
