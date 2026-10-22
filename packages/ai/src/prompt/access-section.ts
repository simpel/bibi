import { FEATURES, featureActions, type PermissionSet } from "@bibi/core";

export type AccessSectionInput = { roles: readonly string[]; permissions: PermissionSet };

/**
 * What the signed-in user may see and do, per feature (ADR 0048, 0050): their preset plus any
 * overrides an admin set. The tools are already limited to their permissions; this says it in
 * words, so the assistant only proposes what they can confirm.
 */
export function accessSection({ roles, permissions }: AccessSectionInput): string {
  const visible = FEATURES.filter((feature) => (permissions[feature] ?? []).length > 0);
  const hidden = FEATURES.filter((feature) => !visible.includes(feature));
  const lines = visible.map((feature) => {
    const granted = permissions[feature] ?? [];
    const missing = featureActions({ feature }).filter((action) => !granted.includes(action));
    const not = missing.length ? `; not ${missing.join(", ")}` : "";
    return `  - ${feature}: ${granted.join(", ")}${not}`;
  });
  return [
    "## Access (data)",
    `- Preset: ${JSON.stringify(roles.join(", ") || "none")}`,
    "- Per feature (anything not listed needs an admin):",
    ...(lines.length ? lines : ["  - nothing"]),
    `- Cannot see: ${hidden.length ? hidden.join(", ") : "nothing hidden"}`,
  ].join("\n");
}
