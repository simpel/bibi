import type { Db } from "@okazi/db";
import { ok, type Result } from "../errors/result";
import { importBookingStatusTemplate } from "../features/booking-status/import-template-operation";
import { createExecuteContext } from "../operations/context";
import { execute } from "../operations/execute";
import { grantAll } from "../permissions/permission-set";

export type ProvisionOrganizationInput = {
  organizationId: string;
  /** Base client; defaults to the process singleton from `@okazi/db`. */
  db?: Db;
};

/**
 * The defaults every new organization starts with, created through core operations as SYSTEM
 * (audited and logged like any command): one booking status per phase (ADR 0022), so bookings
 * work immediately. Called by Better Auth's `afterCreateOrganization` and the demo seed.
 */
export async function provisionOrganization({
  organizationId,
  db,
}: ProvisionOrganizationInput): Promise<Result<true>> {
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({ upTo: "admin" }),
    actor: { type: "system", userId: null },
    ...(db ? { db } : {}),
  });
  const input = { template: "default" };
  const statuses = await execute({ operation: importBookingStatusTemplate, input, context });
  return statuses.ok ? ok({ value: true }) : statuses;
}
