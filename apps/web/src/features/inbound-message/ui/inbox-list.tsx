import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ReadFilterTabs } from "@/components/activity/read-filter-tabs";
import { PageHeader } from "@/components/states/page-header";
import { INBOX_ROUTE } from "@/lib/inbox-routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { type InboxParams, inboxFilterQuery } from "../lib/inbox-params";
import { InboxAddress } from "./inbox-address";
import { InboxFilters } from "./inbox-filters";
import { InboxSection } from "./inbox-section";

export type InboxListProps = { locale: Locale; params: InboxParams };

/**
 * The inbox page body (ADR 0085), laid out like the notifications page: its address, All, Unread
 * and Read, search and channel, then one table of the messages without a ticket.
 */
export async function InboxList({ locale, params }: InboxListProps) {
  const [t, dates, abilities] = await Promise.all([
    getTranslations("inbox"),
    getDateTimeFormat(),
    getCallerAbilities(),
  ]);
  const allowed = {
    canWrite: can({ abilities, permission: "inbox:write" }),
    canDelete: can({ abilities, permission: "inbox:delete" }),
    canCreateTicket: can({ abilities, permission: "ticket:write" }),
  };
  const keep = inboxFilterQuery({ params });
  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <InboxAddress />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ReadFilterTabs pathname={INBOX_ROUTE} read={params.read} keep={keep} />
        <InboxFilters q={params.q} channel={params.channel} />
      </div>
      <InboxSection locale={locale} params={params} dates={dates} abilities={allowed} />
    </div>
  );
}
