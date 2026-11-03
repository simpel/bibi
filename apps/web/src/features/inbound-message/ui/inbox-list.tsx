import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { InboxAddress } from "./inbox-address";
import { InboxSection } from "./inbox-section";

export type InboxListProps = {
  locale: Locale;
  /** The unread table's page. */
  cursor?: string | undefined;
  /** The read table's page. */
  readCursor?: string | undefined;
};

/**
 * The inbox page body (ADR 0085): its address, the unread messages, and below them the ones
 * someone in the team has read. Each table pages on its own.
 */
export async function InboxList({ locale, cursor, readCursor }: InboxListProps) {
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
  const shared = { locale, dates, abilities: allowed };
  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <InboxAddress />
      <InboxSection
        {...shared}
        title={t("unreadTitle")}
        read={false}
        cursor={cursor}
        param="cursor"
        keep={readCursor ? { readCursor } : {}}
      />
      <InboxSection
        {...shared}
        title={t("readTitle")}
        read
        cursor={readCursor}
        param="readCursor"
        keep={cursor ? { cursor } : {}}
      />
    </div>
  );
}
