import { welcomePath } from "./welcome-step";

/** The welcome pages before an organization is chosen (ADR 0061, 0078); never org-scoped. */
export const JOIN_PATHS = {
  /** Invite code from an invitation mail. */
  code: `${welcomePath()}/join`,
  /** Every organization the user can join, and the primary one. */
  organizations: `${welcomePath()}/organizations`,
  create: `${welcomePath()}/new`,
} as const;
