import { resolveLocale } from "@bibi/i18n";
import { firstAdminHref } from "@/components/shell/admin-items";
import { ErrorState } from "@/components/states/error-state";
import { redirect } from "@/lib/navigation";
import { getCallerAbilities } from "@/server/caller-abilities";

type AdminPageProps = { params: Promise<{ locale: string; org: string }> };

/** `/admin` has no page of its own: it opens the first page the caller may view. */
export default async function AdminPage({ params }: AdminPageProps) {
  const [{ locale, org }, { permissions }] = await Promise.all([params, getCallerAbilities()]);
  const href = firstAdminHref({ permissions });
  if (!href) return <ErrorState errorKey="forbidden" />;
  redirect({ href, locale: resolveLocale({ value: locale }), org });
}
