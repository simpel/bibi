import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { loadItem } from "@/features/item/load-item";
import { RoomSettings } from "@/features/table-booking/ui/room-settings";
import { entityTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string; itemId: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { itemId } = await params;
  const item = await loadItem({ id: itemId });
  return entityTitle({ name: item.ok ? item.value.name : null, fallback: "Table booking" });
}

export default async function TableBookingRoomPage({ params }: PageProps) {
  const { locale: rawLocale, itemId } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <RoomSettings locale={locale} itemId={itemId} />;
}
