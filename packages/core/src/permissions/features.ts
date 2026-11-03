/**
 * The parts of the app staff get permissions for (ADR 0050). A permission is `<feature>:<action>`.
 * New feature: add it here; presets, the permission grid and the docs follow from this table.
 */
/**
 * The actions (ADR 0050): `read` sees the feature, `write` creates and changes it (including
 * sending, exporting and moving a ticket's status), `delete` archives it. Bibi never hard-deletes;
 * `delete` is the archive action. `submit` (ADR 0085, `inbox` only) hands a message in from
 * outside without seeing the feature, so unlike `write` and `delete` it does not imply `read`.
 */
export const PERMISSION_ACTIONS = ["read", "write", "delete", "submit"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type ImpliesReadInput = { action: PermissionAction };

/** Whether granting `action` also grants `read` (`write` and `delete` do, `submit` does not). */
export function impliesRead({ action }: ImpliesReadInput): boolean {
  return action === "write" || action === "delete";
}

export const FEATURE_GROUPS = ["bookings", "selling", "catalog", "setup", "organization"] as const;
export type FeatureGroup = (typeof FEATURE_GROUPS)[number];

type FeatureSpec = { group: FeatureGroup; actions: readonly PermissionAction[] };

const all = ["read", "write", "delete"] as const;
/** Features whose records are never archived. */
const noDelete = ["read", "write"] as const;

export const FEATURE_SPECS = {
  ticket: { group: "bookings", actions: all },
  // Inbound messages of every channel (ADR 0085): no archive; dismiss is `write`.
  inbox: { group: "bookings", actions: ["read", "write", "submit"] },
  program: { group: "bookings", actions: all },
  customer: { group: "selling", actions: all },
  quote: { group: "selling", actions: all },
  payment: { group: "selling", actions: noDelete },
  workOrder: { group: "selling", actions: noDelete },
  finance: { group: "selling", actions: noDelete },
  item: { group: "catalog", actions: all },
  venue: { group: "catalog", actions: all },
  priceList: { group: "catalog", actions: all },
  configuration: { group: "setup", actions: all },
  pipeline: { group: "setup", actions: all },
  board: { group: "setup", actions: all },
  template: { group: "setup", actions: all },
  responsibility: { group: "setup", actions: all },
  member: { group: "organization", actions: all },
  apiKey: { group: "organization", actions: all },
  paymentAccount: { group: "organization", actions: noDelete },
  integration: { group: "organization", actions: noDelete },
  // Bibi's own subscription (ADR 0091, 0095): plan, seats, checkout.
  billing: { group: "organization", actions: noDelete },
  audit: { group: "organization", actions: ["read"] },
  assistant: { group: "organization", actions: noDelete },
} as const satisfies Record<string, FeatureSpec>;

export type Feature = keyof typeof FEATURE_SPECS;
export const FEATURES = Object.keys(FEATURE_SPECS) as Feature[];

/**
 * Admin-only lock: every action but `read` on these comes only from the `admin` preset; overrides
 * on them are refused and stale ones ignored. Otherwise one toggle would make someone an admin.
 */
export const LOCKED_FEATURES: readonly Feature[] = [
  "member",
  "apiKey",
  "paymentAccount",
  "integration",
  "billing",
];

/**
 * Shared vocabulary (ADR 0050, feature scope): every screen shows these as labels (a ticket's
 * type and status, a colleague's name), so `read` on them is always granted and cannot be denied.
 * Changing them stays permissioned.
 */
export const ALWAYS_VISIBLE_FEATURES: readonly Feature[] = [
  "configuration",
  "pipeline",
  "board",
  "template",
  "responsibility",
  "member",
];

/**
 * Pseudo-feature for the caller's own space: conversations, personal skills, preferences,
 * settings, connected apps and search (ADR 0039, 0050). Not in `FEATURES`: always granted, and
 * the data layer pins those rows to the caller.
 */
export const SELF_FEATURE = "self";

export type FeatureActionsInput = { feature: Feature };

export function featureActions({ feature }: FeatureActionsInput): readonly PermissionAction[] {
  return FEATURE_SPECS[feature].actions;
}

export type IsLockedInput = { feature: Feature; action: PermissionAction };

/**
 * Whether `feature:action` is fixed by the preset and never overridden: admin-only actions on
 * locked features, and `read` on shared vocabulary (always granted).
 */
export function isLocked({ feature, action }: IsLockedInput): boolean {
  if (action === "read") return ALWAYS_VISIBLE_FEATURES.includes(feature);
  return LOCKED_FEATURES.includes(feature);
}

export type ParseFeatureInput = { feature: string };

/** The feature named exactly `feature`, or `null` for anything else. */
export function parseFeature({ feature }: ParseFeatureInput): Feature | null {
  return FEATURES.find((known) => known === feature) ?? null;
}
