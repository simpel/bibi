import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { SetupList } from "@/features/setup/ui/setup-list";
import { readCursor } from "@/lib/page-cursor";
import { pageTitle } from "@/lib/page-metadata";

type SetupsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export async function generateMetadata({ params }: SetupsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "setups" });
}

export default async function SetupsPage({ params, searchParams }: SetupsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <SetupList locale={locale} cursor={readCursor({ value: cursor })} />
    </SimplePage>
  );
}
