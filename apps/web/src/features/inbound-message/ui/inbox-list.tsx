import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import type { InboxParams } from "../lib/inbox-params";
import { InboxAddress } from "./inbox-address";
import { InboxSection } from "./inbox-section";

export type InboxListProps = { locale: Locale; params: InboxParams };

/**
 * The inbox page body (ADR 0085): its address, then one unified table with `QuerySearch`
 * qualifier filtering and `DataTablePagination`.
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
    canCreateOrder: can({ abilities, permission: "order:write" }),
  };
  const isAdmin =
    abilities.role === "admin" || can({ abilities, permission: "configuration:write" });
  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <InboxAddress isAdmin={isAdmin} />
      <InboxSection locale={locale} params={params} dates={dates} abilities={allowed} />
    </div>
  );
}
