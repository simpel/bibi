import type { ProviderConnection } from "@bibi/db";
import { PAYMENT_METHODS, type ProviderKey } from "../../providers/provider-keys";
import { findProvider, takesMethod } from "../../providers/registry";
import type { ProviderAdapter } from "../../providers/types";
import { connectFieldsOf } from "./connect-fields";
import type {
  IntegrationCapabilities,
  IntegrationConnectionDto,
  IntegrationStatus,
} from "./schema";

export type ToIntegrationDtoInput = {
  row: ProviderConnection | null;
  organizationId: string;
  provider: ProviderKey;
};

/** A hosted account still onboarding reads as PENDING, a restricted one as EXPIRED (act again). */
function statusOf({ row }: { row: ProviderConnection }): IntegrationStatus {
  if (row.disconnectedAt || row.status === "DISCONNECTED") return "DISCONNECTED";
  if (row.status === "ONBOARDING") return "PENDING";
  if (row.status === "RESTRICTED") return "EXPIRED";
  return row.status;
}

/** What the provider can do once connected (ADR 0100): its methods, invoicing and ledger. */
function capabilitiesOf({ adapter }: { adapter: ProviderAdapter | null }): IntegrationCapabilities {
  if (!adapter) return { methods: [], invoicing: false, ledger: false };
  const methods = PAYMENT_METHODS.filter((method) => takesMethod({ adapter, method }));
  return { methods, invoicing: Boolean(adapter.invoicing), ledger: adapter.ledger };
}

/** When the accounts were last read, only while the connection works. */
function syncedOf({ row, status }: { row: ProviderConnection; status: IntegrationStatus }) {
  return status === "CONNECTED" ? row.chartSyncedAt : null;
}

/**
 * No row means the provider was never connected. Sealed secrets and OAuth state stay out.
 * `setupIssues` is derived from the mappings by `loadIntegrationDto`; here it is empty.
 */
export function toIntegrationDto({
  row,
  organizationId,
  provider,
}: ToIntegrationDtoInput): IntegrationConnectionDto {
  const adapter = findProvider({ key: provider });
  const shape = {
    organizationId,
    provider,
    configured: adapter?.isConfigured() ?? false,
    connectKind: adapter?.connect.kind ?? "OAUTH",
    credentialFields: adapter ? connectFieldsOf({ connect: adapter.connect }) : [],
    capabilities: capabilitiesOf({ adapter }),
  };
  if (!row) {
    return {
      id: null,
      ...shape,
      status: "NOT_CONNECTED",
      companyName: null,
      organizationNumber: null,
      connectedAt: null,
      updatedAt: null,
      accountsSyncedAt: null,
      setupIssues: [],
    };
  }
  const status = statusOf({ row });
  return {
    id: row.id,
    ...shape,
    status,
    companyName: row.externalCompanyName,
    organizationNumber: row.externalOrgNumber,
    connectedAt: row.connectedAt,
    updatedAt: row.updatedAt,
    accountsSyncedAt: syncedOf({ row, status }),
    setupIssues: [],
  };
}
