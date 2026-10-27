import { resolveLocale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PaymentPageCard } from "@/features/payment/ui/payment-page-card";
import { loadPublicPayment } from "@/server/load-public-payment";
import { getNumberFormat } from "@/server/number-format";

type PayPageProps = {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ checkout?: string }>;
};

export const dynamic = "force-dynamic";

/** The URL is the credential: no indexing, and no Referer to Stripe or anyone else. */
export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

/** The customer's payment page (ADR 0028): addressed by an unguessable token, no sign-in. */
export default async function PayPage({ params, searchParams }: PayPageProps) {
  const { locale: rawLocale, token } = await params;
  setRequestLocale(resolveLocale({ value: rawLocale }));
  const { checkout } = await searchParams;
  const [payment, numbers] = await Promise.all([loadPublicPayment({ token }), getNumberFormat()]);
  if (!payment) notFound();
  return <PaymentPageCard payment={payment} returning={checkout === "success"} numbers={numbers} />;
}
