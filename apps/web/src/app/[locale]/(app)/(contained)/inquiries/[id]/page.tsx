import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { InquiryDetail } from "@/features/inquiry/ui/inquiry-detail";

type InquiryPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function InquiryPage({ params }: InquiryPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <InquiryDetail locale={locale} id={id} />;
}
