import { resolveLocale } from "@bibi/i18n";
import { redirect } from "@/lib/navigation";
import { orderRoute } from "@/lib/routes";

type UpdateOrderPageProps = { params: Promise<{ locale: string; org: string; id: string }> };

/** The order is edited in place on its own page now; old Edit links land there. */
export default async function UpdateOrderPage({ params }: UpdateOrderPageProps) {
  const { locale: rawLocale, org, id } = await params;
  redirect({ org, locale: resolveLocale({ value: rawLocale }), href: orderRoute({ id }) });
}
