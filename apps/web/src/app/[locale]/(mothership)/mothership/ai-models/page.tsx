import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { AiModelSearchParams } from "@/features/admin/ai-models/ai-model-params";
import { AiModelsView } from "@/features/admin/ai-models/ai-models-view";
import { pageTitle } from "@/lib/page-metadata";

type AdminAiModelsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<AiModelSearchParams>;
};

export async function generateMetadata() {
  return pageTitle({ namespace: "admin", key: "aiModels.title" });
}

export default async function AdminAiModelsPage({ params, searchParams }: AdminAiModelsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <AiModelsView locale={locale} params={await searchParams} />;
}
