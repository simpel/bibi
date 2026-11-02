import type { Db } from "@bibi/db";
import { ok, type Result } from "../errors/result";
import { provisionEndpoints } from "../features/inbound-message/provision-endpoints";
import {
  setOrganizationSetupStatus,
  updateOrganizationProfile,
} from "../features/organization-profile/operations";
import type { SetupStatus } from "../features/organization-profile/schema";
import { importStatusGridTemplate } from "../features/status-grid/operations";
import { importTicketStatusTemplate } from "../features/ticket-status/import-template-operation";
import { createExecuteContext } from "../operations/context";
import { execute } from "../operations/execute";
import { grantAll } from "../permissions/permission-set";
import { claimCreatorDomain, type OrganizationCreator } from "./claim-creator-domain";

export type ProvisionOrganizationInput = {
  organizationId: string;
  /** IANA zone the creator chose (ADR 0064 decision 3a); stored on the profile. */
  timeZone: string;
  /** Base client; defaults to the process singleton from `@bibi/db`. */
  db?: Db;
  /** `none` leaves the pipeline to the caller (the demo seed sets up its own); default `default`. */
  pipeline?: "default" | "none";
  /** The first setup status of its profile (ADR 0061); default `PENDING`, the demo seed is set up. */
  setupStatus?: SetupStatus;
  /** Who created it (Better Auth); their verified work domain starts domain join (ADR 0078). */
  creator?: OrganizationCreator;
};

/**
 * The defaults every new organization starts with, created through core operations as SYSTEM
 * (audited and logged like any command): its profile with the chosen time zone (ADR 0064) and
 * the first setup `PENDING` (ADR 0061), domain join with the creator's domain (ADR 0078), its
 * inbox and API endpoints (ADR 0085), and the default ticket statuses (ADR 0043) with their status
 * grid (ADR 0044), so tickets work immediately. Called by Better Auth's `afterCreateOrganization`
 * and the demo seed.
 */
export async function provisionOrganization({
  organizationId,
  timeZone,
  db,
  pipeline = "default",
  setupStatus = "PENDING",
  creator,
}: ProvisionOrganizationInput): Promise<Result<true>> {
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
    ...(db ? { db } : {}),
  });
  const zone = { operation: updateOrganizationProfile, input: { timeZone }, context };
  const profile = await execute(zone);
  if (!profile.ok) return profile;
  const status = { operation: setOrganizationSetupStatus, input: { setupStatus }, context };
  const started = await execute(status);
  if (!started.ok) return started;
  if (creator) {
    const claimed = await claimCreatorDomain({ organizationId, creator, ...(db ? { db } : {}) });
    if (!claimed.ok) return claimed;
  }
  const endpoints = await provisionEndpoints({ context, ...(db ? { db } : {}) });
  if (!endpoints.ok) return endpoints;
  if (pipeline === "none") return ok({ value: true });
  const input = { template: "default" } as const;
  const statuses = await execute({ operation: importTicketStatusTemplate, input, context });
  if (!statuses.ok) return statuses;
  const grid = await execute({ operation: importStatusGridTemplate, input, context });
  return grid.ok ? ok({ value: true }) : grid;
}
