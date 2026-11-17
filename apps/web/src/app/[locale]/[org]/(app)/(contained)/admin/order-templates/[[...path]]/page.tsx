import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

type OldOrderTemplatesPageProps = {
  params: Promise<{ locale: string; org: string; path?: string[] }>;
};

/** Packages left the administration area (ADR 0112): old links open the same page under `/packages`. */
export default async function OldOrderTemplatesRedirect({ params }: OldOrderTemplatesPageProps) {
  const { locale, org, path = [] } = await params;
  const href = [ROUTES.packages, ...path.map(encodeURIComponent)].join("/");
  redirect({ href, locale: resolveLocale({ value: locale }), org });
}
