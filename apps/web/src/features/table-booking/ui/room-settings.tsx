import type { Locale } from "@bibi/i18n";
import { PageBand, PageBands } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { AdminBand } from "@/components/admin/admin-section";
import { CrumbName } from "@/components/shell/crumb-name";
import { DeferredSection } from "@/components/states/deferred-section";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadItem } from "@/features/item/load-item";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { dayOf } from "../lib/edge-time";
import { tableBookingRoomRoute } from "../lib/routes";
import { loadDiningRoom } from "../load-room-settings";
import { ExceptionsSection } from "./exceptions-section";
import { OpenUntilControl } from "./open-until-control";
import { SittingsSection } from "./sittings-section";
import { TablesSection } from "./tables-section";

export type RoomSettingsProps = { locale: Locale; itemId: string };

/**
 * `/admin/table-booking/{itemId}`: one room's booking settings as sections (ADR 0119). The header
 * and "open until" come from two reads; each other section loads inside its own boundary.
 */
export async function RoomSettings({ locale, itemId }: RoomSettingsProps) {
  const [t, abilities, item, room] = await Promise.all([
    getTranslations("tableBooking"),
    getCallerAbilities(),
    loadItem({ id: itemId }),
    loadDiningRoom({ itemId }),
  ]);
  if (!item.ok) return <ErrorState errorKey={handleLoadError({ error: item.error, locale })} />;
  if (!room.ok) return <ErrorState errorKey={handleLoadError({ error: room.error, locale })} />;
  const timeZone = item.value.timeZone;
  const day = dayOf({ instant: room.value.openUntil, timeZone });
  const today = dayOf({ instant: new Date(), timeZone });
  return (
    <PageBands>
      <CrumbName href={tableBookingRoomRoute({ itemId })} name={item.value.name} />
      <PageBand containerClassName="gap-2">
        <PageHeader
          title={item.value.name}
          description={t("room.description", { address: room.value.slug })}
        />
      </PageBand>
      <AdminBand
        anchor="open-until"
        title={t("openUntil.title")}
        description={t("openUntil.description")}
      >
        <OpenUntilControl
          itemId={itemId}
          slug={room.value.slug}
          day={day}
          today={today}
          canEdit={can({ abilities, permission: "diningSetup:write" })}
        />
      </AdminBand>
      <DeferredSection>
        <SittingsSection locale={locale} item={item.value} />
      </DeferredSection>
      <DeferredSection>
        <ExceptionsSection locale={locale} item={item.value} />
      </DeferredSection>
      <DeferredSection>
        <TablesSection locale={locale} item={item.value} />
      </DeferredSection>
    </PageBands>
  );
}
