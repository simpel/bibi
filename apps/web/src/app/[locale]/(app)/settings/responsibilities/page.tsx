import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ResponsibilityList } from "@/features/responsibility/ui/responsibility-list";
import { readCursor } from "@/lib/page-cursor";

type ResponsibilitiesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function ResponsibilitiesPage({
  params,
  searchParams,
}: ResponsibilitiesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <ResponsibilityList locale={locale} cursor={readCursor({ value: cursor })} />;
}
