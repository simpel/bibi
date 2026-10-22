import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AssistantHome } from "@/features/assistant/ui/assistant-home";

type HomePageProps = { params: Promise<{ locale: string }> };

/** The app's home is the assistant, full width (ADR 0035). */
export default async function HomePage({ params }: HomePageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <AssistantHome />;
}
