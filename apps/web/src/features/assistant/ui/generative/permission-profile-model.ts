import {
  FEATURES,
  type Feature,
  type OverrideEffect,
  type PermissionAction,
  type PermissionProfile,
} from "@okazi/core/schemas";

export type BuildPermissionModelInput = {
  profile: PermissionProfile;
  feature: (key: Feature) => string;
  action: (key: PermissionAction) => string;
};

/** Translated rows for the permission card: overrides, visible features and hidden ones. */
export function buildPermissionModel({ profile, feature, action }: BuildPermissionModelInput) {
  const chip = ({ f, a }: { f: Feature; a: PermissionAction }) => `${feature(f)}: ${action(a)}`;
  const byEffect = ({ effect }: { effect: OverrideEffect }) =>
    profile.overrides
      .filter((o) => o.effect === effect)
      .map((o) => chip({ f: o.feature, a: o.action }));
  const visible = FEATURES.filter((f) => profile.effective[f]?.includes("read"));
  return {
    allowed: byEffect({ effect: "allow" }),
    denied: byEffect({ effect: "deny" }),
    features: visible.map((f) => ({
      label: feature(f),
      actions: (profile.effective[f] ?? []).map(action).join(", "),
    })),
    hidden: FEATURES.filter((f) => !visible.includes(f)).map(feature),
  };
}
