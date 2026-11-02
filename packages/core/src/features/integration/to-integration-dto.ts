import type { IntegrationConnection } from "@bibi/db";
import { fortnoxCredentials } from "./fortnox/fortnox-config";
import type { IntegrationConnectionDto, IntegrationProvider } from "./schema";

export type ToIntegrationDtoInput = {
  row: IntegrationConnection | null;
  organizationId: string;
  provider: IntegrationProvider;
};

const CONFIGURED: Record<IntegrationProvider, () => boolean> = {
  FORTNOX: () => fortnoxCredentials() !== null,
};

/** No row means the provider was never connected. Sealed tokens and OAuth state stay out. */
export function toIntegrationDto({
  row,
  organizationId,
  provider,
}: ToIntegrationDtoInput): IntegrationConnectionDto {
  const configured = CONFIGURED[provider]();
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
    status: row.status,
    configured,
    companyName: row.externalCompanyName,
    organizationNumber: row.externalOrgNumber,
    connectedAt: row.connectedAt,
    updatedAt: row.updatedAt,
  };
}
