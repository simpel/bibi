import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { SetupList } from "@/features/setup/ui/setup-list";
import { readCursor } from "@/lib/page-cursor";

type SetupsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function SetupsPage({ params, searchParams }: SetupsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return <SetupList locale={locale} cursor={readCursor({ value: cursor })} />;
}
