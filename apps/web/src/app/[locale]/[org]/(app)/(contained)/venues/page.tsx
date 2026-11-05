import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { VenueList } from "@/features/venue/ui/venue-list";
import { readCursor } from "@/lib/page-cursor";
import { pageTitle } from "@/lib/page-metadata";

type VenuesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export async function generateMetadata({ params }: VenuesPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "venues" });
}

export default async function VenuesPage({ params, searchParams }: VenuesPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale({ value: rawLocale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <VenueList locale={locale} cursor={readCursor({ value: cursor })} />
    </SimplePage>
  );
}
