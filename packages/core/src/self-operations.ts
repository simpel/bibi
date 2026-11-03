import { fileOperations, getFile, uploadFile } from "./features/file/operations";
import {
  countUnreadNotifications,
  listNotifications,
  notificationOperations,
} from "./features/notification/operations";
import {
  deleteNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  markNotificationsUnread,
  notificationWriteOperations,
} from "./features/notification/write-operations";
import {
  listNotificationPreferences,
  notificationPreferenceOperations,
  setNotificationPreference,
} from "./features/notification-preference/operations";
import {
  getProfile,
  getWorkingHours,
  profileOperations,
  setWorkingHours,
  updateProfile,
} from "./features/profile/operations";
import {
  listUserPreferences,
  setUserPreference,
  userPreferenceOperations,
} from "./features/user-preference/operations";
import {
  getUserSettings,
  updateUserSettings,
  userSettingsOperations,
} from "./features/user-settings/operations";

/**
 * The caller's own data: preferences, settings, profile, working hours, files and notifications
 * (ADR 0039, 0046, 0061, 0063, 0094). Only `self:*`: the system actor and API keys are refused.
 */
export const selfOperations = [
  ...userPreferenceOperations,
  ...userSettingsOperations,
  ...profileOperations,
  ...fileOperations,
  ...notificationOperations,
  ...notificationPreferenceOperations,
];

export {
  countUnreadNotifications,
  deleteNotifications,
  fileOperations,
  getFile,
  getProfile,
  getUserSettings,
  getWorkingHours,
  listNotificationPreferences,
  listNotifications,
  listUserPreferences,
  markAllNotificationsRead,
  markNotificationsRead,
  markNotificationsUnread,
  notificationOperations,
  notificationPreferenceOperations,
  notificationWriteOperations,
  profileOperations,
  setNotificationPreference,
  setUserPreference,
  setWorkingHours,
  updateProfile,
  updateUserSettings,
  uploadFile,
  userPreferenceOperations,
  userSettingsOperations,
};
