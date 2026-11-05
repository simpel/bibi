import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadInboundMessage } from "@/features/inbound-message/load-inbound-message";
import { MessageDetail } from "@/features/inbound-message/ui/message-detail";
import { entityTitle } from "@/lib/page-metadata";

type InboxMessagePageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: InboxMessagePageProps) {
  const { id } = await params;
  const res = await loadInboundMessage({ id });
  return entityTitle({
    name: res.ok ? res.value.subject : null,
    fallback: "Message",
  });
}

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
