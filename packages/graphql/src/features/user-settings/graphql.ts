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
  description: "The caller's own settings: how every date, time, number and amount is written.",
});

fieldFromOperation({ operation: getUserSettings, type: UserSettingsRef, name: "userSettings" });
mutationFromOperation({ operation: updateUserSettings, type: UserSettingsRef });
