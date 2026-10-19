import {
  getUserSettings,
  listUserPreferences,
  setUserPreference,
  type UserPreferenceDto,
  UserPreferenceSchema,
  type UserSettingsDto,
  UserSettingsSchema,
  updateUserSettings,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

export const UserPreferenceRef = objectFromSchema<UserPreferenceDto>({
  name: "UserPreference",
  schema: UserPreferenceSchema,
  description: "One of the caller's own UI preferences (e.g. saved table column order).",
});

const UserPreferenceListRef = builder
  .objectRef<{ items: UserPreferenceDto[] }>("UserPreferenceList")
  .implement({
    description: "The caller's preferences (not paginated: a user has few).",
    fields: (t) => ({
      items: t.field({ type: [UserPreferenceRef], resolve: (list) => list.items }),
    }),
  });

fieldFromOperation({
  operation: listUserPreferences,
  type: UserPreferenceListRef,
  name: "userPreferences",
});
mutationFromOperation({ operation: setUserPreference, type: UserPreferenceRef });

export const UserSettingsRef = objectFromSchema<UserSettingsDto>({
  name: "UserSettings",
  schema: UserSettingsSchema,
  description: "The caller's own settings, e.g. where they are in the first setup.",
});

fieldFromOperation({ operation: getUserSettings, type: UserSettingsRef, name: "userSettings" });
mutationFromOperation({ operation: updateUserSettings, type: UserSettingsRef });
