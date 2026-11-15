import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { canonicalMyWorkHref, myWorkToday } from "@/features/my-work/my-work-path";
import { MyWorkPage } from "@/features/my-work/ui/my-work-page";
import { redirect } from "@/lib/navigation";
import { pageTitle } from "@/lib/page-metadata";

type MyWorkRouteProps = {
  params: Promise<{ locale: string; org: string; from: string; to: string }>;
};

export async function generateMetadata({ params }: MyWorkRouteProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "myWork" });
}

/** The member's own work from `{from}` to `{to}`, inclusive (ADR 0064, 0110). */
export default async function MyWorkRoute({ params }: MyWorkRouteProps) {
  const { org, from, to, ...rest } = await params;
  const locale = resolveLocale({ value: rest.locale });
  setRequestLocale(locale);
  const today = await myWorkToday();
  const canonical = canonicalMyWorkHref({ from, to, today });
  if (canonical) redirect({ href: canonical, locale, org });
  return <MyWorkPage locale={locale} from={from} to={to} today={today} />;
}
