import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { VenueList } from "@/features/venue/ui/venue-list";
import { readCursor } from "@/lib/page-cursor";

type VenuesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

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
