/**
 * The caller's own data and the organization's profile, shown with the generic `json` component
 * (with the reason). Part of `GENERIC_UI_TOOLS`; kept apart so the registry fits its file.
 */
export const SELF_GENERIC_UI_TOOLS: Readonly<Record<string, string>> = {
  oauthGrant_list: "connected apps are managed on /profile, not in chat",
  oauthGrant_revoke: "connected apps are managed on /profile, not in chat",
  userPreference_list: "UI preference bookkeeping (e.g. table column order), not a tool card",
  userPreference_set: "UI preference bookkeeping (e.g. table column order), not a tool card",
  notification_unreadCount: "the unread count is the bell's red dot (ADR 0094), not a tool card",
  notification_markRead: "read state bookkeeping (ADR 0094); the count is read out, not a card",
  notification_markUnread: "read state bookkeeping (ADR 0094); the count is read out, not a card",
  notification_markAllRead: "read state bookkeeping (ADR 0094); the count is read out, not a card",
  notificationPreference_list: "notification choices are set on /profile (ADR 0094); JSON",
  notificationPreference_set: "notification choices are set on /profile (ADR 0094); JSON",
  userSettings_get: "date and clock formats are set on /profile, not a tool card",
  userSettings_update: "date and clock formats are set on /profile, not a tool card",
  profile_get: "the profile is edited in the welcome flow and on /profile (#418), not a tool card",
  profile_update:
    "the profile is edited in the welcome flow and on /profile (#418), not a tool card",
  accountingExport_list: "the export history is on the Financials page; shown as JSON",
  accountingSettings_get: "accounting settings are edited on /settings/accounting (ADR 0077); JSON",
  accountingSettings_update:
    "accounting settings are edited on /settings/accounting (ADR 0077); JSON",
  paymentSettings_get: "payment settings are edited on Settings → Integrations (ADR 0090); JSON",
  paymentSettings_update: "payment settings are edited on Settings → Integrations (ADR 0090); JSON",
  deposit_suggest: "a suggested amount the assistant reads out; no card of its own (ADR 0090)",
  workingHours_get: "working hours are edited in the welcome flow (#418); shown as JSON",
  workingHours_set: "working hours are edited in the welcome flow (#418); shown as JSON",
  file_upload: "returns only a storage key; the avatar is shown by the profile UI",
  file_get: "base64 bytes, not something to render as a card",
  organizationProfile_get: "organization details are edited in the welcome flow (#418); JSON",
  organizationProfile_update: "organization details are edited in the welcome flow (#418); JSON",
  organizationProfile_setSetupStatus: "first setup bookkeeping (ADR 0061), not a tool card",
  organizationProfile_setDomainJoin: "an organization setting (ADR 0078), edited in settings; JSON",
};
