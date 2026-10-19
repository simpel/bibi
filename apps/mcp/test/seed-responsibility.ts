import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { ExecuteContext } from "@okazi/core";
import { expect } from "vitest";
import { call } from "./helpers";
import { seedOrgMember } from "./seed-org-member";

export type SeedResponsibilityInput = { client: Client; context: ExecuteContext };

/**
 * A responsibility (ADR 0034) a sheet can go to, defaulting to a new member. Seeds the
 * organization's Better Auth rows, so call it once per context.
 */
export async function seedResponsibility({
  client,
  context,
}: SeedResponsibilityInput): Promise<string> {
  const member = await seedOrgMember({ context });
  const made = await call({
    client,
    name: "responsibility_create",
    args: { name: "Secret kitchen", defaultAssigneeId: member.userId },
  });
  expect(made.isError, JSON.stringify(made.data)).toBe(false);
  return made.data.id;
}
