import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { HistoryView } from "@/features/assistant/ui/history-view";

type ChatsPageProps = { params: Promise<{ locale: string }> };

/** All earlier conversations as a full page; the sidebar shows only the latest few. */
export default async function ChatsPage({ params }: ChatsPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return <HistoryView />;
}
