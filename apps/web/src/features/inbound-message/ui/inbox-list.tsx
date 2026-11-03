import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { InboxAddress } from "./inbox-address";
import { InboxSection } from "./inbox-section";

export type InboxListProps = { locale: Locale; cursor?: string | undefined };

/**
 * The inbox page body (ADR 0085): its address and its messages without a ticket, read and
 * unread in one table (unread ones white with a dot, read ones grey), newest first.
 */
export async function InboxList({ locale, cursor }: InboxListProps) {
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
  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <InboxAddress />
      <InboxSection locale={locale} cursor={cursor} dates={dates} abilities={allowed} />
    </div>
  );
}
