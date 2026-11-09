import { Card, CardContent } from "@bibi/ui";
import { getTranslations } from "next-intl/server";

export const INTEGRATION_OUTCOMES = ["connected", "denied", "expired", "failed"] as const;
export type IntegrationOutcome = (typeof INTEGRATION_OUTCOMES)[number];

export type IntegrationNoticeProps = { outcome: IntegrationOutcome; name: string };

/** What happened when a provider sent the admin back (`?provider=&outcome=`, ADR 0087, 0100). */
export async function IntegrationNotice({ outcome, name }: IntegrationNoticeProps) {
  const t = await getTranslations("integration.notice");
  return (
    <Card role="status" className="shadow-none">
      <CardContent className="text-sm text-foreground">{t(outcome, { name })}</CardContent>
    </Card>
  );
}
