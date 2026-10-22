import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AiModelsView } from "@/features/admin/ai-models/ai-models-view";

type AdminAiModelsPageProps = { params: Promise<{ locale: string }> };

export default async function AdminAiModelsPage({ params }: AdminAiModelsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <AiModelsView locale={locale} />;
}
