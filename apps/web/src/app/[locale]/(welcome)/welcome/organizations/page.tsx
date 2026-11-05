import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { loadJoinable } from "@/features/welcome/load-joinable";
import { JoinableList } from "@/features/welcome/ui/join/joinable-list";
import { pageTitle } from "@/lib/page-metadata";
import { requireAnySession } from "@/server/auth-pages";

type OrganizationsRouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: OrganizationsRouteProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "welcome", key: "join.listTitle" });
}

/** Every organization the user can join, and their primary one (ADR 0078). */
export default async function OrganizationsRoute({ params }: OrganizationsRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const state = await requireAnySession({ locale });
  return <JoinableList joinable={await loadJoinable({ session: state.session })} />;
}
