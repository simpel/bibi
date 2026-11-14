import { checkIntegrationSetup } from "./check-setup-operation";
import { completeIntegrationConnect } from "./complete-connect-operation";
import { connectIntegration } from "./connect-operation";
import { disconnectIntegration } from "./disconnect-operation";
import { listIntegrations } from "./read-operations";
import { refreshExpiringIntegrations } from "./refresh-expiring-operation";

export {
  checkIntegrationSetup,
  completeIntegrationConnect,
  connectIntegration,
  disconnectIntegration,
  listIntegrations,
  refreshExpiringIntegrations,
};

/**
 * Connections to outside systems (ADR 0087), on every surface. `integration.completeConnect` (the
 * web callback) and `integration.refreshExpiring` (the worker) are run directly, never registered.
 */
export const integrationOperations = [
  listIntegrations,
  connectIntegration,
  disconnectIntegration,
  checkIntegrationSetup,
];
