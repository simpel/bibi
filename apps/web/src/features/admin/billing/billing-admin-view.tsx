import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { handleLoadError } from "@/server/load-error";
import { platformOperations } from "@/server/platform-operations";
import { runPlatformOperation } from "@/server/run-platform-operation";
import { FinancialOverview } from "./financial-overview";
import { PlanProducts } from "./plan-products";
import { ProductBreakdownTable } from "./product-breakdown-table";
import { StripeActivityView } from "./stripe-activity-card";
import { StripeInvoicesTable } from "./stripe-invoices-table";
import { StripeSettingsDialog } from "./stripe-settings-dialog";
import { StripeTransactionsTable } from "./stripe-transactions-table";

export type BillingAdminViewProps = { locale: Locale };

/** `/mothership/billing` (ADR 0095 §1): Live financial data from Stripe and Bibi's Stripe setup. */
export async function BillingAdminView({ locale }: BillingAdminViewProps) {
  const ops = platformOperations();
  const [t, config, financials] = await Promise.all([
    getTranslations("admin.billing"),
    runPlatformOperation({ operation: ops.getBillingConfig, input: {} }),
    runPlatformOperation({ operation: ops.getBillingFinancials, input: {} }),
  ]);

  const header = (
    <PageHeader
      title={t("title")}
      description={t("description")}
      actions={
        config.ok ? (
          <StripeSettingsDialog
            config={config.value}
            productsNode={<PlanProducts config={config.value} />}
          />
        ) : null
      }
    />
  );

  const error = !config.ok ? config.error : !financials.ok ? financials.error : null;
  if (error || !config.ok || !financials.ok) {
    return (
      <div className="grid gap-6">
        {header}
        {error ? <ErrorState errorKey={handleLoadError({ error, locale })} /> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {header}
      <FinancialOverview financials={financials.value} />

      <section className="grid gap-3">
        <div>
          <h2 className="text-base font-semibold">{t("productsBreakdown.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("productsBreakdown.description")}</p>
        </div>
        <ProductBreakdownTable
          products={financials.value.products}
          currency={financials.value.currency}
        />
      </section>

      {financials.value.configured ? (
        <section className="grid gap-3">
          <div>
            <h2 className="text-base font-semibold">{t("financials.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("financials.description")}</p>
          </div>
          <StripeActivityView
            transactionsNode={
              <StripeTransactionsTable transactions={financials.value.recentTransactions} />
            }
            invoicesNode={<StripeInvoicesTable invoices={financials.value.recentInvoices} />}
          />
        </section>
      ) : null}
    </div>
  );
}
