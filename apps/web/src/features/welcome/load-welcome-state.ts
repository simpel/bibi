import "server-only";
import {
  getOrganizationProfile,
  getProfile,
  getWorkingHours,
  type OrganizationProfileDto,
  type ProfileDto,
  type Result,
  type WorkingHoursDto,
} from "@bibi/core";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";
import { nextWelcomeStep, type WelcomeStep } from "./lib/welcome-step";

export type WelcomeState = {
  profile: ProfileDto;
  hours: WorkingHoursDto;
  organization: OrganizationProfileDto;
  /** The member may do the setup (`pipeline:write`, ADR 0061). */
  canSetup: boolean;
  /** Where `/:org/welcome` sends the member, or null when the app opens. */
  next: WelcomeStep | null;
};

/** Everything the welcome router and its pages decide on, read through core (ADR 0010). */
export async function loadWelcomeState(): Promise<Result<WelcomeState>> {
  const [profile, hours, organization, abilities] = await Promise.all([
    runOperation({ operation: getProfile, input: {} }),
    runOperation({ operation: getWorkingHours, input: {} }),
    runOperation({ operation: getOrganizationProfile, input: {} }),
    getCallerAbilities(),
  ]);
  if (!profile.ok) return profile;
  if (!hours.ok) return hours;
  if (!organization.ok) return organization;
  const canSetup = can({ abilities, permission: "pipeline:write" });
  const { firstName, lastName, phone } = profile.value;
  const next = nextWelcomeStep({
    profileComplete: Boolean(firstName && lastName && phone),
    hoursSet: hours.value.days.length > 0,
    setupStatus: organization.value.setupStatus,
    canSetup,
  });
  const value = { profile: profile.value, hours: hours.value, organization: organization.value };
  return { ok: true, value: { ...value, canSetup, next } };
}
