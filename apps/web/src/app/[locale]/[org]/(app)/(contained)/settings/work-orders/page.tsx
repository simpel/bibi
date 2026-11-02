import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { WorkOrderDefinitionList } from "@/features/work-order-definition/ui/work-order-definition-list";
import { readCursor } from "@/lib/page-cursor";

type WorkOrdersPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
};

export default async function WorkOrdersPage({ params, searchParams }: WorkOrdersPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  const { cursor } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <WorkOrderDefinitionList locale={locale} cursor={readCursor({ value: cursor })} />
    </SimplePage>
  );
}
