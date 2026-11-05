import { getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { renderSeatRequestEmail } from "@bibi/mail";
import { sendAuthMail } from "../mail";
import { webUrl } from "../urls";
import { resolveUserLocale } from "../user-locale";
import { billingAudience } from "./billing-admins";

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
  const url = webUrl({ path: `/${organization.slug}/settings/billing` });
  for (const admin of admins) {
    const locale = await resolveUserLocale({ userId: admin.id, email: admin.email });
    const rendered = renderSeatRequestEmail({
      who,
      organization: organization.name,
      inviteeEmail,
      url,
      adminName: admin.name,
      locale,
    });
    await sendAuthMail({
      kind: "billing.seat-request",
      to: admin.email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    }).catch((error: unknown) =>
      getLogger().warn({ event: "billing.seatRequestMailFailed", organizationId, err: error }),
    );
  }
}
