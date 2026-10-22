import {
  FEATURE_GROUPS,
  FEATURE_SPECS,
  FEATURES,
  type Feature,
  type FeatureGroup,
  isLocked,
  type PermissionAction,
  type PermissionOverride,
  type PermissionSet,
} from "@bibi/core/schemas";

/** One row of the grid: a feature with the actions it has (ADR 0050). */
export type GridRow = {
  feature: Feature;
  group: FeatureGroup;
  actions: readonly PermissionAction[];
};

export type CellInput = { feature: Feature; action: PermissionAction };

export function cellKey({ feature, action }: CellInput): string {
  return `${feature}:${action}`;
}

/** Every feature, grouped in the order of `FEATURE_GROUPS`. */
export function gridRows(): GridRow[] {
  return FEATURE_GROUPS.flatMap((group) =>
    FEATURES.filter((feature) => FEATURE_SPECS[feature].group === group).map((feature) => ({
      feature,
      group,
      actions: FEATURE_SPECS[feature].actions as readonly PermissionAction[],
    })),
  );
}

export type GrantedKeysInput = { permissions: PermissionSet };

/** The `feature:action` keys a permission set holds. */
export function grantedKeys({ permissions }: GrantedKeysInput): string[] {
  return Object.entries(permissions).flatMap(([feature, actions]) =>
    (actions ?? []).map((action) => `${feature}:${action}`),
  );
}

export type IsOnInput = CellInput & { granted: readonly string[] };

/** A cell is on when granted and its feature is viewable (every action implies view). */
export function isOn({ granted, feature, action }: IsOnInput): boolean {
  if (!granted.includes(cellKey({ feature, action }))) return false;
  return action === "read" || granted.includes(cellKey({ feature, action: "read" }));
}

export type SetCellInput = IsOnInput & { on: boolean };

/** Turn a cell on or off. View off takes the whole feature away; any action on brings view. */
export function setCell({ granted, feature, action, on }: SetCellInput): string[] {
  const key = cellKey({ feature, action });
  const view = cellKey({ feature, action: "read" });
  if (on) return [...new Set([...granted, key, view])];
  if (action !== "read") return granted.filter((entry) => entry !== key);
  const editable = FEATURE_SPECS[feature].actions.filter(
    (candidate) => !isLocked({ feature, action: candidate as PermissionAction }),
  );
  const dropped = new Set(editable.map((candidate) => cellKey({ feature, action: candidate })));
  return granted.filter((entry) => !dropped.has(entry));
}

export type PresetCellInput = CellInput & { preset: PermissionSet };

export function presetHas({ preset, feature, action }: PresetCellInput): boolean {
  return preset[feature]?.includes(action) ?? false;
}

/** Whether the cell differs from the preset; locked cells never do. */
export function isOverridden({
  granted,
  preset,
  feature,
  action,
}: IsOnInput & { preset: PermissionSet }): boolean {
  if (isLocked({ feature, action })) return false;
  return isOn({ granted, feature, action }) !== presetHas({ preset, feature, action });
}

export type ToOverridesInput = { granted: readonly string[]; preset: PermissionSet };

/** The complete override list that turns the preset into the chosen cells. */
export function toOverrides({ granted, preset }: ToOverridesInput): PermissionOverride[] {
  return gridRows().flatMap(({ feature, actions }) =>
    actions
      .filter((action) => isOverridden({ granted, preset, feature, action }))
      .map((action) => ({
        feature,
        action,
        effect: isOn({ granted, feature, action }) ? ("allow" as const) : ("deny" as const),
      })),
  );
}
