import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { itemRoute } from "@/lib/routes";

type UpdateItemPageProps = { params: Promise<{ locale: string; org: string; id: string }> };

/** The item is edited in place on its own page now; old Edit links land there. */
export default async function UpdateItemPage({ params }: UpdateItemPageProps) {
  const { locale: rawLocale, org, id } = await params;
  redirect({ org, locale: resolveLocale({ value: rawLocale }), href: itemRoute({ id }) });
}
