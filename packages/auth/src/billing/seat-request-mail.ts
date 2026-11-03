import { getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { sendAuthMail } from "../mail";
import { webUrl } from "../urls";
import { billingAudience, greeting } from "./billing-admins";

export type SeatRequestMailInput = {
  organizationId: string;
  /** Who asked: the inviter, or the person joining by domain. */
  requesterId: string;
  /** The invited email; left out when the requester is the one joining. */
  inviteeEmail?: string;
};

/**
 * Tells every admin that someone waits for a seat (ADR 0095 §6) and links to Settings → Billing,
 * where they approve or refuse it. One failed mail is logged; the others still go out.
 */
export async function sendSeatRequestMail({
  organizationId,
  requesterId,
  inviteeEmail,
}: SeatRequestMailInput): Promise<void> {
  const [{ organization, admins }, requester] = await Promise.all([
    billingAudience({ organizationId }),
    getDb().user.findUnique({ where: { id: requesterId }, select: { name: true, email: true } }),
  ]);
  const who = requester?.name || requester?.email || "Someone";
  const what = inviteeEmail ? `${who} invited ${inviteeEmail} to` : `${who} asked to join`;
  const url = webUrl({ path: `/${organization.slug}/settings/billing` });
  for (const admin of admins) {
    const text = [
      greeting(admin),
      `${what} ${organization.name} on Bibi, but all seats are taken.`,
      `Approve it to add a seat (49 SEK a month), or decline it:\n${url}`,
      "— Bibi",
    ].join("\n\n");
    await sendAuthMail({
      ...{ kind: "billing.seat-request", to: admin.email, text },
      subject: `A seat is waiting for your approval in ${organization.name}`,
    }).catch((error: unknown) =>
      getLogger().warn({ event: "billing.seatRequestMailFailed", organizationId, err: error }),
    );
  }
}
