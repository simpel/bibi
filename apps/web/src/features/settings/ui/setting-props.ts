import type { ToolUiProps } from "@bibi/ai";
import type { SettingKey } from "@bibi/core/schemas";
import type { ComponentType } from "react";

/** The organization's settings as the assistant reads them (`settings.view`). */
export type SettingsViewValue = ToolUiProps["setting-cards"]["view"];

export type SettingGroups = Omit<SettingsViewValue, "keys">;

/** What one setting's row gets: the shared view, and a way to put a saved group back in it. */
export type SettingEditorProps = {
  view: SettingsViewValue;
  onSaved: (input: { patch: Partial<SettingGroups> }) => void;
};

/** One row component per setting; a missing key is a type error. */
export type SettingRowRegistry = Record<SettingKey, ComponentType<SettingEditorProps>>;
