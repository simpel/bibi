import type { Db } from "@okazi/db";
import { ok, type Result } from "../errors/result";
import { importPhaseGridTemplate } from "../features/phase-grid/operations";
import { importTicketPhaseTemplate } from "../features/ticket-phase/import-template-operation";
import { createExecuteContext } from "../operations/context";
import { execute } from "../operations/execute";
import { grantAll } from "../permissions/permission-set";

export type ProvisionOrganizationInput = {
  organizationId: string;
  /** Base client; defaults to the process singleton from `@okazi/db`. */
  db?: Db;
  /** `none` leaves the pipeline to the caller (the demo seed sets up its own); default `default`. */
  pipeline?: "default" | "none";
};

/**
 * The defaults every new organization starts with, created through core operations as SYSTEM
 * (audited and logged like any command): the default ticket phases (ADR 0043) with their
 * phase grid (ADR 0044), so tickets work immediately. Called by Better Auth's
 * `afterCreateOrganization` and the demo seed.
 */
export async function provisionOrganization({
  organizationId,
  db,
  pipeline = "default",
}: ProvisionOrganizationInput): Promise<Result<true>> {
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
    ...(db ? { db } : {}),
  });
  if (pipeline === "none") return ok({ value: true });
  const input = { template: "default" } as const;
  const phases = await execute({ operation: importTicketPhaseTemplate, input, context });
  if (!phases.ok) return phases;
  const grid = await execute({ operation: importPhaseGridTemplate, input, context });
  return grid.ok ? ok({ value: true }) : grid;
}
