"use client";

import type { PaymentAttemptDto } from "@bibi/core/schemas";
import { Button, QrCode } from "@bibi/ui";
import { useState, useTransition } from "react";
import { encodeQr } from "@/lib/qr/qr-code";
import { startPaymentAttemptAction } from "../public-actions";
import { AutoRefresh } from "./auto-refresh";

/** The methods a customer starts on the pay page (ADR 0100). */
export type PickableMethod = "CARD" | "SWISH";

/** Texts prepared on the server: the public page ships no message catalogue to the browser. */
export type PaymentMethodPickerLabels = {
  methods: Record<PickableMethod, string>;
  scan: string;
  openApp: string;
  waiting: string;
  failed: string;
};

export type PaymentMethodPickerProps = {
  token: string;
  methods: readonly PickableMethod[];
  labels: PaymentMethodPickerLabels;
};

type SwishState = { attempt: PaymentAttemptDto; qr: boolean[][] | null };

/** The app link that opens Swish on the phone and returns to this page afterwards. */
function appLinkOf({ attempt }: { attempt: PaymentAttemptDto }): string | null {
  if (attempt.url && !attempt.url.startsWith("https://")) return attempt.url;
  if (!attempt.qrToken) return null;
  const back = encodeURIComponent(window.location.href);
  return `swish://paymentrequest?token=${encodeURIComponent(attempt.qrToken)}&callbackurl=${back}`;
}

/**
 * The customer chooses how to pay (ADR 0100): card goes to the hosted checkout (the action
 * redirects), Swish shows a QR code to scan on a computer and an app link on a phone, then the
 * page refreshes until the payment is confirmed.
 */
export function PaymentMethodPicker({ token, methods, labels }: PaymentMethodPickerProps) {
  const [pending, startTransition] = useTransition();
  const [swish, setSwish] = useState<SwishState | null>(null);
  const [failed, setFailed] = useState(false);
  const start = ({ method }: { method: PickableMethod }) =>
    startTransition(async () => {
      setFailed(false);
      const result = await startPaymentAttemptAction({ token, method });
      if (!result.ok) return setFailed(true);
      const { qrToken } = result.value;
      const qr = qrToken ? (encodeQr({ text: `D${qrToken}` })?.modules ?? null) : null;
      setSwish({ attempt: result.value, qr });
    });
  if (swish) {
    const appLink = appLinkOf({ attempt: swish.attempt });
    return (
      <div data-slot="swish-attempt" className="grid justify-items-center gap-3 text-center">
        {swish.qr ? (
          <div className="hidden justify-items-center gap-2 md:grid">
            <QrCode modules={swish.qr} label={labels.scan} />
            <p className="text-sm text-muted-foreground">{labels.scan}</p>
          </div>
        ) : null}
        {appLink ? (
          <Button asChild size="lg" className="w-full md:hidden">
            <a href={appLink}>{labels.openApp}</a>
          </Button>
        ) : null}
        <p className="text-sm text-muted-foreground">{labels.waiting}</p>
        <AutoRefresh />
      </div>
    );
  }
  return (
    <div data-slot="payment-method-picker" className="grid gap-2">
      {methods.map((method, index) => (
        <Button
          key={method}
          size="lg"
          variant={index === 0 ? "default" : "outline"}
          disabled={pending}
          onClick={() => start({ method })}
        >
          {labels.methods[method]}
        </Button>
      ))}
      {failed ? <p className="text-center text-sm text-destructive">{labels.failed}</p> : null}
    </div>
  );
}
