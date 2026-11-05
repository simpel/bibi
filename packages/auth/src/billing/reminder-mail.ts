import { getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { renderReminderEmail } from "@bibi/mail";
import { sendAuthMail } from "../mail";
import { webUrl } from "../urls";
import { resolveUserLocale } from "../user-locale";
import { billingAudience } from "./billing-admins";

export type ReminderMailInput = { organizationId: string; requesterId: string | null };

/** A friendly nudge to every admin that the trial is over and Bibi needs payment details. */
export async function sendBillingReminderMail({
  organizationId,
  requesterId,
}: ReminderMailInput): Promise<void> {
  const [{ organization, admins }, requester] = await Promise.all([
    billingAudience({ organizationId }),
    requesterId
      ? getDb().user.findUnique({ where: { id: requesterId }, select: { name: true } })
      : null,
  ]);
  const who = requester?.name?.trim() || "A colleague";
  const url = webUrl({ path: `/${organization.slug}/billing/pay` });
  for (const admin of admins) {
    const locale = await resolveUserLocale({ userId: admin.id, email: admin.email });
    const rendered = renderReminderEmail({
      who,
      organization: organization.name,
      url,
      adminName: admin.name,
      locale,
    });
    await sendAuthMail({
      kind: "billing.reminder",
      to: admin.email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    }).catch((error: unknown) =>
      getLogger().warn({ event: "billing.reminderMailFailed", organizationId, err: error }),
    );
  }
}
