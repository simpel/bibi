import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { windowFrom } from "@/features/my-work/lib/my-work-window";
import { myWorkToday } from "@/features/my-work/my-work-path";
import { MyWorkPage } from "@/features/my-work/ui/my-work-page";
import { pageTitle } from "@/lib/page-metadata";

type HomePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "myWork" });
}

/** The organization's start page: the member's own timeline from today (ADR 0110). */
export default async function HomePage({ params }: HomePageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const today = await myWorkToday();
  return <MyWorkPage locale={locale} {...windowFrom({ from: today })} today={today} />;
}
