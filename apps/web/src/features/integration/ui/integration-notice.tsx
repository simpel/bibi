import { getTranslations } from "next-intl/server";

export const INTEGRATION_OUTCOMES = [
  "connected",
  "denied",
  "expired",
  "notReady",
  "failed",
] as const;
export type IntegrationOutcome = (typeof INTEGRATION_OUTCOMES)[number];

export type IntegrationNoticeProps = { outcome: IntegrationOutcome; name: string };

/**
 * Why connecting failed when a provider sent the admin back (`?provider=&outcome=`, ADR 0087,
 * 0100): one line in the card, no box. A success shows nothing: the status and company say it.
 */
export async function IntegrationNotice({ outcome, name }: IntegrationNoticeProps) {
  if (outcome === "connected") return null;
  const t = await getTranslations("integration.notice");
  return (
    <p role="status" className="text-destructive">
      {t(outcome, { name })}
    </p>
  );
}
