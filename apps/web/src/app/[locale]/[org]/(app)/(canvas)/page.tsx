import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AssistantHome } from "@/features/assistant/ui/assistant-home";
import { pageTitle } from "@/lib/page-metadata";

type HomePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "assistant" });
}

/** The app's home is the assistant, full width (ADR 0035). */
export default async function HomePage({ params }: HomePageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <AssistantHome />;
}
