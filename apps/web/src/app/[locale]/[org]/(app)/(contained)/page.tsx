import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { startWindow } from "@/features/my-work/lib/my-work-window";
import { myWorkToday } from "@/features/my-work/my-work-path";
import { MyWorkPage } from "@/features/my-work/ui/my-work-page";
import { pageTitle } from "@/lib/page-metadata";

type HomePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
};

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "myWork" });
}

/** The organization's start page: the member's own timeline from today (ADR 0110). */
export default async function HomePage({ params, searchParams }: HomePageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const [today, { q }] = await Promise.all([myWorkToday(), searchParams]);
  const search = typeof q === "string" ? q : undefined;
  return <MyWorkPage locale={locale} {...startWindow({ today })} today={today} q={search} />;
}
