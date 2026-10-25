import {
  getUserSettings,
  type UserSettingsDto,
  UserSettingsSchema,
  updateUserSettings,
} from "@bibi/core";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

export const UserSettingsRef = objectFromSchema<UserSettingsDto>({
  name: "UserSettings",
  schema: UserSettingsSchema,
  description: "The caller's own settings: the date format and clock every date is shown in.",
});

fieldFromOperation({ operation: getUserSettings, type: UserSettingsRef, name: "userSettings" });
mutationFromOperation({ operation: updateUserSettings, type: UserSettingsRef });
