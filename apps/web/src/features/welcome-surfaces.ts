import type { WebSurface } from "./web-surfaces";

/** The welcome flow (ADR 0061): profile, hours and the first setup of an organization. */
export const WELCOME_SURFACES: readonly WebSurface[] = [
  { operation: "profile.get", route: "/welcome/profile" },
  { operation: "profile.update", route: "/welcome/profile" },
  { operation: "file.upload", route: "/welcome/profile" },
  { operation: "file.get", route: "/welcome/profile" },
  { operation: "workingHours.get", route: "/welcome/hours" },
  { operation: "workingHours.set", route: "/welcome/hours" },
  { operation: "organizationProfile.get", route: "/welcome/setup/organization" },
  { operation: "organizationProfile.update", route: "/welcome/setup/organization" },
  { operation: "organizationProfile.setSetupStatus", route: "/welcome/setup/review" },
  { operation: "pipelineSetup.preview", route: "/welcome/setup/review" },
  { operation: "pipelineSetup.activate", route: "/welcome/setup/review" },
  { operation: "pipelineSetup.presetDraft", route: "/welcome/setup/kind" },
];
