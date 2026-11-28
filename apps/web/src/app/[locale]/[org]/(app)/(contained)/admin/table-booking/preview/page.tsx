import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { BookingPreview } from "@/features/table-booking/ui/booking-preview";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "tableBooking.preview", key: "title" });
}

export default async function BookingPreviewPage({ params }: PageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <BookingPreview locale={locale} />;
}
