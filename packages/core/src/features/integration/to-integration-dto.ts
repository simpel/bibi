import type { ProviderConnection } from "@bibi/db";
import type { ProviderKey } from "../../providers/provider-keys";
import { findProvider } from "../../providers/registry";
import type { IntegrationConnectionDto, IntegrationStatus } from "./schema";

export type ToIntegrationDtoInput = {
  row: ProviderConnection | null;
  organizationId: string;
  provider: ProviderKey;
};

/** OAuth connections never onboard or get restricted; the hosted states read as their nearest. */
function statusOf({ row }: { row: ProviderConnection }): IntegrationStatus {
  if (row.status === "ONBOARDING") return "PENDING";
  if (row.status === "RESTRICTED") return "EXPIRED";
  return row.status;
}

/** No row means the provider was never connected. Sealed secrets and OAuth state stay out. */
export function toIntegrationDto({
  row,
  organizationId,
  provider,
}: ToIntegrationDtoInput): IntegrationConnectionDto {
  const configured = findProvider({ key: provider })?.isConfigured() ?? false;
  if (!row) {
    return {
      id: null,
      organizationId,
      provider,
      status: "NOT_CONNECTED",
      configured,
      companyName: null,
      organizationNumber: null,
      connectedAt: null,
      updatedAt: null,
    };
  }
  return {
    id: row.id,
    organizationId,
    provider,
    status: statusOf({ row }),
    configured,
    companyName: row.externalCompanyName,
    organizationNumber: row.externalOrgNumber,
    connectedAt: row.connectedAt,
    updatedAt: row.updatedAt,
  };
}
