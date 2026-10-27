import type { NumberFormat, PublicPaymentDto } from "@bibi/core/schemas";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { AutoRefresh } from "./auto-refresh";
import { type PaymentOutcome, paymentOutcome } from "./payment-outcome";

export type PaymentPageCardProps = {
  payment: PublicPaymentDto;
  returning?: boolean;
  /** The viewer's number format: `getNumberFormat()` on the server, the hook in a client card. */
  numbers: NumberFormat;
};

const TITLE_KEY = {
  pay: "title",
  processing: "processingTitle",
  invoice: "title",
  paid: "paidTitle",
  expired: "expiredTitle",
  unavailable: "unavailableTitle",
} as const satisfies Record<PaymentOutcome, string>;

const DESCRIPTION_KEY = {
  pay: "description",
  processing: "processingDescription",
  invoice: "invoiceDescription",
  paid: "paidDescription",
  expired: "expiredDescription",
  unavailable: "unavailableDescription",
} as const satisfies Record<PaymentOutcome, string>;

/** What the customer sees at `/pay/<token>`: the amount and a way to pay, or why not. */
export function PaymentPageCard({ payment, returning = false, numbers }: PaymentPageCardProps) {
  const t = useTranslations("payment.public");
  const { money } = numbers;
  const outcome = paymentOutcome({ payment, returning });
  const values = { organization: payment.organizationName, reference: payment.ticketReference };
  const amount = money({ minor: payment.amountMinor, currency: payment.currency });
  const showAmount = outcome !== "expired" && outcome !== "unavailable";
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t(TITLE_KEY[outcome], values)}</CardTitle>
        <CardDescription>{t(DESCRIPTION_KEY[outcome], values)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {showAmount ? (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">{t("amount")}</span>
            <span className="text-2xl font-semibold">{amount}</span>
          </div>
        ) : null}
        {outcome === "processing" ? <AutoRefresh /> : null}
        {outcome === "pay" && payment.paymentUrl ? (
          <>
            <Button asChild size="lg">
              <a href={payment.paymentUrl} rel="noreferrer">
                {t("pay")}
              </a>
            </Button>
            <p className="text-center text-sm text-muted-foreground">{t("secured")}</p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
