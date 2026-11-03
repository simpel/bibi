import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import {
  type InboxSearchParams,
  readInboxParams,
} from "@/features/inbound-message/lib/inbox-params";
import { InboxList } from "@/features/inbound-message/ui/inbox-list";

type InboxPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<InboxSearchParams>;
};

export default async function InboxPage({ params, searchParams }: InboxPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const view = readInboxParams({ params: await searchParams });
  return (
    <SimplePage>
      <InboxList locale={locale} params={view} />
    </SimplePage>
  );
}
