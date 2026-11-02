import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { InboxList } from "@/features/inbound-message/ui/inbox-list";
import { readCursor } from "@/lib/page-cursor";

type InboxPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cursor?: string | string[]; view?: string | string[] }>;
};

export default async function InboxPage({ params, searchParams }: InboxPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale({ value: rawLocale });
  const { cursor, view } = await searchParams;
  setRequestLocale(locale);
  return (
    <SimplePage>
      <InboxList
        locale={locale}
        cursor={readCursor({ value: cursor })}
        dismissed={view === "dismissed"}
      />
    </SimplePage>
  );
}
