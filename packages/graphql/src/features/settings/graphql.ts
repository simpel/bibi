import { type SettingsView, SettingsViewSchema, viewSettings } from "@bibi/core";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const SettingsViewRef = objectFromSchema<SettingsView>({
  name: "SettingsView",
  schema: SettingsViewSchema,
  description: "The organization's settings asked for by key, each gated by its feature's read.",
});

fieldFromOperation({ operation: viewSettings, type: SettingsViewRef, name: "settingsView" });
