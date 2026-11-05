import { resolveLocale } from "@bibi/i18n";
import { redirect } from "next/navigation";

type RedirectProps = { params: Promise<{ locale: string; org: string }> };

export default async function SellableRedirect({ params }: RedirectProps) {
  const { locale, org } = await params;
  const resolvedLocale = resolveLocale({ value: locale });
  redirect(`/${resolvedLocale}/${org}/welcome/setup/food`);
}
