import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadQuotePage } from "@/features/quote/load-quote-page";
import { QuoteDetail } from "@/features/quote/ui/quote-detail";
import { entityTitle } from "@/lib/page-metadata";

type QuotePageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: QuotePageProps) {
  const { id } = await params;
  const page = await loadQuotePage({ id });
  if (page.ok) {
    return entityTitle({ name: `Quote v${page.value.quote.version}`, fallback: "Quote" });
  }
  return entityTitle({ fallback: "Quote" });
}

export default async function QuotePage({ params }: QuotePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <QuoteDetail locale={locale} id={id} />
    </SimplePage>
  );
}
