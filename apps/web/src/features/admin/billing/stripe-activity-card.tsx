"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type StripeActivityViewProps = {
  transactionsNode: ReactNode;
  invoicesNode: ReactNode;
};

/** Tabbed view for Stripe financial activity: balance transactions and subscription invoices. */
export function StripeActivityView({ transactionsNode, invoicesNode }: StripeActivityViewProps) {
  const t = useTranslations("admin.billing.financials");

  return (
    <Tabs defaultValue="transactions" className="grid gap-4">
      <TabsList className="w-fit">
        <TabsTrigger value="transactions">{t("tabs.transactions")}</TabsTrigger>
        <TabsTrigger value="invoices">{t("tabs.invoices")}</TabsTrigger>
      </TabsList>
      <TabsContent value="transactions" className="focus-visible:outline-none">
        {transactionsNode}
      </TabsContent>
      <TabsContent value="invoices" className="focus-visible:outline-none">
        {invoicesNode}
      </TabsContent>
    </Tabs>
  );
}

export { StripeActivityView as StripeActivityCard };
