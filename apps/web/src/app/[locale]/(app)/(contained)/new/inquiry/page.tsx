import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { InquiryCreate } from "@/features/inquiry/ui/inquiry-create";

type NewInquiryPageProps = { params: Promise<{ locale: string }> };

export default async function NewInquiryPage({ params }: NewInquiryPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <InquiryCreate locale={locale} />;
}
