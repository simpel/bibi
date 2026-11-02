import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { MessageDetail } from "@/features/inbound-message/ui/message-detail";

type InboxMessagePageProps = { params: Promise<{ locale: string; id: string }> };

export default async function InboxMessagePage({ params }: InboxMessagePageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <MessageDetail locale={locale} id={id} />
    </SimplePage>
  );
}
