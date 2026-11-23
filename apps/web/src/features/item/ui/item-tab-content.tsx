import type { EntityTypeDto, ItemDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { DeferredSection } from "@/components/states/deferred-section";
import { LayoutsSection } from "../../floor-plan/ui/layouts-section";
import { DemandsSection } from "../../item-demand/ui/demands-section";
import { OccupancySection } from "../../occupancy/ui/occupancy-section";
import type { ItemTab } from "../item-tabs";
import { hasCapability } from "./has-capability";
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
export function ItemTabContent({ locale, item, type, data, canEdit, tab }: ItemTabContentProps) {
  const venueName = data.venues.find(({ id }) => id === item.venueId)?.name ?? "";
  switch (tab) {
    case "layouts":
      return (
        <DeferredSection>
          <LayoutsSection locale={locale} itemId={item.id} canEdit={canEdit} />
        </DeferredSection>
      );
    case "bookings":
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
            venue={item.venueId ? { id: item.venueId, name: venueName } : null}
          />
        </DeferredSection>
      );
  }
}
