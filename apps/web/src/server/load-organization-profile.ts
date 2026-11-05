import "server-only";
import { getOrganizationProfile, type OrganizationProfileDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "./run-operation";

/** The active organization's profile, read once per request (zone, welcome gate, and others share it). */
export const loadOrganizationProfile = cache(
  (): Promise<Result<OrganizationProfileDto>> =>
    runOperation({ operation: getOrganizationProfile, input: {} }),
);
