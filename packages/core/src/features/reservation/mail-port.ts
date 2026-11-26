import type { Result } from "../../errors/result";

export type ReservationMailKind = "confirmation" | "changed" | "cancelled" | "reminder";

/**
 * One mail to a guest about their table (ADR 0119), ready to render. The same shape as
 * `@bibi/mail`'s `sendReservationMail` input, so apps inject that function as the port.
 */
export type ReservationMailMessage = {
  kind: ReservationMailKind;
  locale: "sv" | "en";
  to: string;
  restaurant: {
    name: string;
    logoUrl?: string;
    accentColor?: string;
    phone?: string;
    email?: string;
    policy?: string;
  };
  reservation: {
    dateLabel: string;
    timeLabel: string;
    partySize: number;
    bookerName: string;
    note?: string;
  };
  manageUrl: string;
  bookUrl: string;
};

/** The mail port core needs; core cannot depend on `@bibi/mail` (like `FileStore`). */
export type ReservationMailer = (message: ReservationMailMessage) => Promise<Result<unknown>>;

const port = globalThis as typeof globalThis & { __bibiReservationMailer?: ReservationMailer };

/** Apps set it at startup: `setReservationMailer({ mailer: sendReservationMail })`. */
export function setReservationMailer({ mailer }: { mailer: ReservationMailer | undefined }) {
  port.__bibiReservationMailer = mailer;
}

/** The mailer, or undefined: mails are then skipped (logged), never a failed booking. */
export function getReservationMailer(): ReservationMailer | undefined {
  return port.__bibiReservationMailer;
}
