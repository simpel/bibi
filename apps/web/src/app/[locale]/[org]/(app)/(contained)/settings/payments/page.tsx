import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { PaymentSettings } from "@/features/payment-account/ui/payment-settings";

type PaymentsPageProps = { params: Promise<{ locale: string }> };

/** Deposit rule and invoice provider; the Stripe connection lives on Integrations (ADR 0090). */
export default async function PaymentsPage({ params }: PaymentsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <PaymentSettings locale={locale} />
    </SimplePage>
  );
}
