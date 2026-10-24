import type { Db } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import { updateOrganizationProfile } from "../../features/organization-profile/operations";
import { setWorkingHours, updateProfile } from "../../features/profile/operations";
import { DEFAULT_WORKING_HOURS } from "../../features/profile/working-hours-schema";
import { createExecuteContext, type ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { grantAll } from "../../permissions/permission-set";
import type { DemoOrg } from "./types";
import type { DemoUserIds } from "./users";

export type SeedDemoProfilesInput = {
  db: Db;
  context: ExecuteContext;
  org: DemoOrg;
  userIds: DemoUserIds;
};

/** A stable Swedish mobile number per user, e.g. `+46 70 100 00 03`. */
const phoneOf = ({ index }: { index: number }) =>
  `+46 70 100 00 ${String(index + 1).padStart(2, "0")}`;

type SeedUserInput = {
  db: Db;
  organizationId: string;
  userId: string;
  name: string;
  index: number;
};

/** One user's profile and default hours, saved as that user (the operations are `self:*`). */
async function seedUserProfile({ db, organizationId, userId, name, index }: SeedUserInput) {
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "user", userId },
    db,
  });
  const [firstName = name, ...rest] = name.split(" ");
  const input = { firstName, lastName: rest.join(" ") || firstName, phone: phoneOf({ index }) };
  const profile = await execute({ operation: updateProfile, input, context });
  if (!profile.ok) return profile;
  const days = [...DEFAULT_WORKING_HOURS];
  return execute({ operation: setWorkingHours, input: { days }, context });
}

/**
 * The welcome flow's data (ADR 0061): every demo user has a complete profile and hours, and the
 * organization has its address and time zone, so seeded users go straight to the board.
 */
export async function seedDemoProfiles({
  db,
  context,
  org,
  userIds,
}: SeedDemoProfilesInput): Promise<Result<null>> {
  const { venue } = org.config;
  const address = {
    streetAddress: venue.streetAddress,
    postalCode: venue.postalCode,
    city: venue.city,
  };
  const input = { legalName: org.name, ...address, contactEmail: null, timeZone: org.timeZone };
  const saved = await execute({ operation: updateOrganizationProfile, input, context });
  if (!saved.ok) return saved;
  const users = [...userIds.entries()];
  for (const [index, [name, userId]] of users.entries()) {
    const organizationId = context.organizationId;
    const seeded = await seedUserProfile({ db, organizationId, userId, name, index });
    if (!seeded.ok) return seeded;
  }
  return ok({ value: null });
}
