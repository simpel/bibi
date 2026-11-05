import type { Locale } from "@bibi/i18n";

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

export type MagicLinkEmailInput = {
  url: string;
  locale?: Locale;
};

export type OtpEmailInput = {
  otp: string;
  locale?: Locale;
};

export type PasswordResetEmailInput = {
  url: string;
  locale?: Locale;
};

export type InvitationEmailInput = {
  inviter: string;
  organization: string;
  url: string;
  code?: string | null;
  locale?: Locale;
};

export type SeatRequestEmailInput = {
  who: string;
  organization: string;
  inviteeEmail?: string;
  url: string;
  adminName?: string | null;
  locale?: Locale;
};

export type ReminderEmailInput = {
  who: string;
  organization: string;
  url: string;
  adminName?: string | null;
  locale?: Locale;
};
