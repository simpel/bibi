import { Card, CardContent } from "@bibi/ui";
import { getTranslations } from "next-intl/server";

export const INTEGRATION_OUTCOMES = ["connected", "denied", "expired", "failed"] as const;
export type IntegrationOutcome = (typeof INTEGRATION_OUTCOMES)[number];

export type IntegrationNoticeProps = { outcome: IntegrationOutcome };

/** What happened when Fortnox sent the admin back (`?fortnox=`, ADR 0087). */
export async function IntegrationNotice({ outcome }: IntegrationNoticeProps) {
  const t = await getTranslations("integration.notice");
  return (
    <Card role="status" className="shadow-none">
      <CardContent className="text-sm">{t(outcome)}</CardContent>
    </Card>
  );
}
