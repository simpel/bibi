import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { InquiryUpdate } from "@/features/inquiry/ui/inquiry-update";

type UpdateInquiryPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function UpdateInquiryPage({ params }: UpdateInquiryPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <InquiryUpdate locale={locale} id={id} />;
}
