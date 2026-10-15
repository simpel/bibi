import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PaymentAccountPanel } from "@/features/payment-account/ui/payment-account-panel";

type PaymentsPageProps = { params: Promise<{ locale: string }> };

export default async function PaymentsPage({ params }: PaymentsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <PaymentAccountPanel locale={locale} />;
}
