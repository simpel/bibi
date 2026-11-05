import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { ResponsibilityList } from "@/features/responsibility/ui/responsibility-list";
import { readCursor } from "@/lib/page-cursor";
import { pageTitle } from "@/lib/page-metadata";

type ResponsibilitiesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export async function generateMetadata({ params }: ResponsibilitiesPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "responsibilities" });
}

export default async function ResponsibilitiesPage({
  params,
  searchParams,
}: ResponsibilitiesPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <ResponsibilityList locale={locale} cursor={readCursor({ value: cursor })} />
    </SimplePage>
  );
}
