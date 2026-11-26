import type { Result } from "@bibi/core";
import type { SentMail } from "./schema";
import { sendMail } from "./send-mail";
import { type ReservationMailInput, renderReservationEmail } from "./templates/reservation";

export type SendReservationMailInput = ReservationMailInput;

/** Renders a table-reservation mail and sends it through `sendMail` (logged as `reservation.<kind>`). */
export async function sendReservationMail({
  to,
  ...input
}: SendReservationMailInput): Promise<Result<SentMail>> {
  const { subject, html, text } = renderReservationEmail(input);
  return sendMail({
    kind: `reservation.${input.kind}`,
    to,
    subject,
    html,
    text,
    ...(input.restaurant.email ? { replyTo: input.restaurant.email } : {}),
  });
}
