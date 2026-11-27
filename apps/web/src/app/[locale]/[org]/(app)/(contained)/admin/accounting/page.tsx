import { listIntegrations } from "@bibi/core";
import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/lib/navigation";
import { integrationRoute, ROUTES } from "@/lib/routes";
import { runOperation } from "@/server/run-operation";

type PageProps = { params: Promise<{ locale: string; org: string }> };

/**
 * Accounts are mapped on the connected accounting system's own settings page (ADR 0123): this old
 * address goes there, or to the integrations list when none is connected.
 */
export default async function AccountingPage({ params }: PageProps) {
  const { locale: rawLocale, org } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  const list = await runOperation({ operation: listIntegrations, input: {} });
  const ledger = list.ok
    ? list.value.items.find(
        (item) =>
          item.capabilities.ledger && (item.status === "CONNECTED" || item.status === "EXPIRED"),
      )
    : undefined;
  redirect({
    href: ledger ? integrationRoute({ provider: ledger.provider }) : ROUTES.adminIntegrations,
    locale,
    org,
  });
}
