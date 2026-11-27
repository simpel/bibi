"use client";

import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import { DangerZone, DangerZoneRow } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { DisconnectProviderButton } from "./disconnect-provider-button";

export type ProviderDangerAreaProps = {
  connection: Pick<IntegrationConnectionDto, "provider" | "connectKind" | "capabilities">;
  name: string;
};

/** Last on a provider's page: the one place it is disconnected from. */
export function ProviderDangerArea({ connection, name }: ProviderDangerAreaProps) {
  const t = useTranslations("integration.card");
  const common = useTranslations("common");
  return (
    <DangerZone title={common("dangerArea")}>
      <DangerZoneRow
        title={t("disconnectTitle", { name })}
        description={
          connection.connectKind === "HOSTED_ONBOARDING"
            ? t("disconnectHostedConfirm", { name })
            : connection.capabilities.ledger
              ? t("disconnectLedgerConfirm", { name })
              : t("disconnectConfirm", { name })
        }
        action={<DisconnectProviderButton connection={connection} name={name} inDangerArea />}
      />
    </DangerZone>
  );
}
