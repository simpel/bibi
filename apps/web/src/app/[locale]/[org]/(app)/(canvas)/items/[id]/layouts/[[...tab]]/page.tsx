import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { LayoutsPage } from "@/features/floor-plan/ui/layouts-page";
import { loadItem } from "@/features/item/load-item";
import { entityTitle } from "@/lib/page-metadata";

type LayoutsRouteProps = {
  params: Promise<{ locale: string; org: string; id: string; tab?: string[] }>;
};

export async function generateMetadata({ params }: LayoutsRouteProps) {
  const { id } = await params;
  const item = await loadItem({ id });
  return entityTitle({ name: item.ok ? item.value.name : null, fallback: "Layouts" });
}

/** One layout of an item (ADR 0099, 0102): `/items/{id}/layouts/{layoutId}`. */
export default async function LayoutsRoute({ params }: LayoutsRouteProps) {
  const { locale: rawLocale, org, id, tab } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <LayoutsPage locale={locale} org={org} itemId={id} layoutId={tab?.[0]} />;
}
