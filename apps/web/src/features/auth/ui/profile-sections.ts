/** The profile page's sections, in page order: each card's anchor id and its nav label key. */
export const PROFILE_SECTIONS = [
  { id: "details", label: "details" },
  { id: "display", label: "displayTitle" },
  { id: "notifications", label: "notificationsTitle" },
  { id: "sessions", label: "sessionsTitle" },
  { id: "apps", label: "appsTitle" },
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTIONS)[number]["id"];

export type ProfileSectionLink = { id: ProfileSectionId; label: string };
