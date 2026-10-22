"use server";

import {
  type FileUploadInput,
  type OrganizationProfileDto,
  type OrganizationProfileUpdateInput,
  type ProfileDto,
  type ProfileUpdateInput,
  setWorkingHours,
  updateOrganizationProfile,
  updateProfile,
  uploadFile,
  type WorkingHoursDto,
  type WorkingHoursSetInput,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

/** `/:org/welcome/profile`: names and phone (ADR 0061). */
export async function saveProfileAction({
  input,
}: {
  input: ProfileUpdateInput;
}): Promise<ActionResult<ProfileDto>> {
  return toActionResult({ result: await runOperation({ operation: updateProfile, input }) });
}

/** The avatar's bytes; the returned key goes into `saveProfileAction` (ADR 0063). */
export async function uploadAvatarAction({
  input,
}: {
  input: FileUploadInput;
}): Promise<ActionResult<{ key: string }>> {
  return toActionResult({ result: await runOperation({ operation: uploadFile, input }) });
}

/** `/:org/welcome/hours`: the whole week. */
export async function saveHoursAction({
  input,
}: {
  input: WorkingHoursSetInput;
}): Promise<ActionResult<WorkingHoursDto>> {
  return toActionResult({ result: await runOperation({ operation: setWorkingHours, input }) });
}

/** `/:org/welcome/setup/organization`: legal, contact and address data. */
export async function saveOrganizationAction({
  input,
}: {
  input: OrganizationProfileUpdateInput;
}): Promise<ActionResult<OrganizationProfileDto>> {
  const result = await runOperation({ operation: updateOrganizationProfile, input });
  return toActionResult({ result });
}
