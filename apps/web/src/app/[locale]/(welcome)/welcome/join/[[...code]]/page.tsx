import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/lib/navigation";
import { pageTitle } from "@/lib/page-metadata";
import { ROUTES } from "@/lib/routes";
import { requireAnySession } from "@/server/auth-pages";

type JoinRouteProps = { params: Promise<{ locale: string; code?: string[] }> };

export async function generateMetadata({ params }: JoinRouteProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "welcome", key: "join.codeTitle" });
}

/** `/welcome/join[/<code>]`: leads back to the main view (/welcome), prefilling the code if present. */
export default async function JoinRoute({ params }: JoinRouteProps) {
  const { locale: value, code } = await params;
  const locale = resolveLocale({ value });
  setRequestLocale(locale);
  await requireAnySession({ locale });
  const rawCode = code?.[0];
  const href = rawCode ? `${ROUTES.welcome}?code=${encodeURIComponent(rawCode)}` : ROUTES.welcome;
  redirect({ href, locale });
}
