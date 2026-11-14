import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { pageParam } from "@/features/my-work/lib/page-param";
import { myWorkToday } from "@/features/my-work/my-work-path";
import { MyWorkPage } from "@/features/my-work/ui/my-work-page";
import { pageTitle } from "@/lib/page-metadata";

type HomePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "myWork" });
}

/** The organization's start page: the member's own work today (ADR 0110). */
export default async function HomePage({ params, searchParams }: HomePageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const today = await myWorkToday();
  const page = pageParam({ value: (await searchParams).page });
  return <MyWorkPage locale={locale} from={today} to={today} today={today} page={page} />;
}
