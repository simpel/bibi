import type { ToolUiProps } from "@bibi/ai";
import type { SettingKey } from "@bibi/core/schemas";
import type { ComponentType } from "react";

/** The organization's settings as the assistant reads them (`settings.view`). */
export type SettingsViewValue = ToolUiProps["setting-cards"]["view"];

export type SettingGroups = Omit<SettingsViewValue, "keys">;

/** What one setting's card gets: the shared view, and a way to put a saved group back in it. */
export type SettingCardProps = {
  view: SettingsViewValue;
  onSaved: (input: { patch: Partial<SettingGroups> }) => void;
};

/** One card component per setting; a missing key is a type error. */
export type SettingCardRegistry = Record<SettingKey, ComponentType<SettingCardProps>>;
