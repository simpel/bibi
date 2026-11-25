import { FEATURES, type Feature } from "./features";
import type { FixedRole } from "./fixed-roles";
import { grantAll, type PermissionSet, unionPermissions } from "./permission-set";

/**
 * Features members do not see by default (managers get `finance`, ADR 0077); `read` on them can
 * still be allowed per member.
 */
const ADMIN_VIEW: readonly Feature[] = [
  "audit",
  "assistant",
  "apiKey",
  "finance",
  "integration",
  "billing",
];

/** The daily work a manager does in full: bookings, selling and money (ADR 0050). */
const MANAGER_FEATURES: readonly Feature[] = [
  "order",
  "program",
  "comment",
  "task",
  "customer",
  "quote",
  "payment",
  "runSheet",
  // Boards are views of the pipeline, not its flow (ADR 0076): managers set them up.
  "board",
  "finance",
  // Packages are sales work (ADR 0112); run sheet definitions (`template`) stay with admins.
  "orderTemplate",
];

/** Managers also maintain items (demands, setup times, working hours) but never archive them (ADR 0059). */
const MANAGER_ITEM_WRITE = grantAll({ features: ["item"], only: "write" });

/**
 * Everyone who works the inbox reads, marks read or unread and deletes it (ADR 0083, 0085). `inbox:submit` is for
 * outside callers (an API key or partner client) and only the admin preset has it, so a key gets
 * it by an explicit allow.
 */
const INBOX_WORK = unionPermissions({
  sets: [
    grantAll({ features: ["inbox"], only: "write" }),
    grantAll({ features: ["inbox"], only: "delete" }),
  ],
});

/** Everyone comments on orders and lines (ADR 0115); archiving others' comments is `delete`. */
const COMMENT_WORK = grantAll({ features: ["comment"], only: "write" });

/** Everyone creates and works tasks (ADR 0117); archiving one is `delete`. */
const TASK_WORK = grantAll({ features: ["task"], only: "write" });

const member = unionPermissions({
  sets: [
    grantAll({
      features: FEATURES.filter((feature) => !ADMIN_VIEW.includes(feature)),
      only: "read",
    }),
    INBOX_WORK,
    COMMENT_WORK,
    TASK_WORK,
  ],
});

/**
 * The presets (ADR 0050): constant, not configurable per organization. Every member and every
 * API key has one; overrides (`applyOverrides`) fine-tune it.
 */
export const PRESET_PERMISSIONS: Readonly<Record<FixedRole, PermissionSet>> = {
  member,
  manager: unionPermissions({
    sets: [member, grantAll({ features: MANAGER_FEATURES }), MANAGER_ITEM_WRITE],
  }),
  admin: grantAll({}),
};

export type PresetPermissionsInput = { preset: FixedRole | null };

/** What a preset grants; no preset grants nothing (fail closed). */
export function presetPermissions({ preset }: PresetPermissionsInput): PermissionSet {
  return preset ? PRESET_PERMISSIONS[preset] : {};
}
