"use client";

import Script from "next/script";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileWidgetProps = {
  siteKey: string;
  scriptUrl: string;
  label: string;
  onToken: (input: { token: string }) => void;
  /** A new value renders a fresh widget, e.g. after a failed submit used up the token. */
  resetKey: number;
};

/** Cloudflare Turnstile (ADR 0119), loaded only on the booking form's step. */
export function TurnstileWidget({ scriptUrl, label, resetKey, ...widget }: TurnstileWidgetProps) {
  const [ready, setReady] = useState(false);
  return (
    <fieldset aria-label={label} className="min-h-16">
      <Script src={scriptUrl} strategy="afterInteractive" onReady={() => setReady(true)} />
      {ready ? <TurnstileSlot key={resetKey} {...widget} /> : null}
    </fieldset>
  );
}

type TurnstileSlotProps = Pick<TurnstileWidgetProps, "siteKey" | "onToken">;

/** One rendered widget; a new `key` replaces it with a fresh one. */
function TurnstileSlot({ siteKey, onToken }: TurnstileSlotProps) {
  const locale = useLocale();
  const element = useRef<HTMLDivElement>(null);
  const latest = useRef(onToken);
  latest.current = onToken;
  // Turnstile's script: renders the widget into the slot and removes it on unmount.
  useEffect(() => {
    const api = window.turnstile;
    if (!api || !element.current) return;
    const send = ({ token }: { token: string }) => latest.current({ token });
    const id = api.render(element.current, {
      sitekey: siteKey,
      language: locale,
      theme: "auto",
      size: "flexible",
      callback: (token: string) => send({ token }),
      "expired-callback": () => send({ token: "" }),
      "error-callback": () => send({ token: "" }),
    });
    return () => api.remove(id);
  }, [siteKey, locale]);
  return <div ref={element} />;
}
