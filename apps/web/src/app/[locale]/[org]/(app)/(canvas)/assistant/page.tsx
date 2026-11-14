import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AssistantHome } from "@/features/assistant/ui/assistant-home";
import { pageTitle } from "@/lib/page-metadata";

type AssistantPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: AssistantPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "assistant" });
}

/** The assistant, full width (ADR 0035, moved off `/` by ADR 0110). */
export default async function AssistantPage({ params }: AssistantPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <AssistantHome />;
}
