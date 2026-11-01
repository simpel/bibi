import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { QuoteDetail } from "@/features/quote/ui/quote-detail";

type QuotePageProps = { params: Promise<{ locale: string; id: string }> };

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
