import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { FloorPlanPage } from "@/features/floor-plan/ui/floor-plan-page";
import { loadItem } from "@/features/item/load-item";
import { entityTitle } from "@/lib/page-metadata";

type FloorPlanRouteProps = { params: Promise<{ locale: string; org: string; id: string }> };

export async function generateMetadata({ params }: FloorPlanRouteProps) {
  const { id } = await params;
  const item = await loadItem({ id });
  return entityTitle({ name: item.ok ? item.value.name : null, fallback: "Floor plan" });
}

/** The room's floor plan: walls, doors, windows and fixed parts (ADR 0102). */
export default async function FloorPlanRoute({ params }: FloorPlanRouteProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <FloorPlanPage locale={locale} itemId={id} />;
}
