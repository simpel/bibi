import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AdminSections } from "@/components/admin/admin-sections";
import { loadAdminPage } from "@/components/admin/load-admin-page";
import { BookingPageSection } from "@/features/table-booking/ui/booking-page-section";
import { DiningRoomSection } from "@/features/table-booking/ui/dining-room-section";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "tableBooking" });
}

export default async function TableBookingPage({ params }: PageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { title, show } = await loadAdminPage({ key: "tableBooking" });
  return (
    <AdminSections title={title}>
      {show.has("diningRooms") ? <DiningRoomSection locale={locale} /> : null}
      {show.has("bookingPage") ? <BookingPageSection locale={locale} /> : null}
    </AdminSections>
  );
}
