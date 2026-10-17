import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { readMine } from "@/features/assignment/ui/mine-filter";
import { InquiryList } from "@/features/inquiry/ui/inquiry-list";
import { readCursor } from "@/lib/page-cursor";

type InquiriesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[]; mine?: string | string[] }>;
};

export default async function InquiriesPage({ params, searchParams }: InquiriesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor, mine } = await searchParams;
  setRequestLocale(locale);
  return (
    <InquiryList
      locale={locale}
      cursor={readCursor({ value: cursor })}
      mine={readMine({ value: mine })}
    />
  );
}
