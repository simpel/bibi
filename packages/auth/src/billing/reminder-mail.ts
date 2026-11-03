import { getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { sendAuthMail } from "../mail";
import { webUrl } from "../urls";
import { billingAudience, greeting } from "./billing-admins";

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
    const text = [
      greeting(admin),
      `${who} just tried to open Bibi for ${organization.name}. The free trial is over, so ` +
        "Bibi is waiting for payment details before the team can carry on.",
      `It only takes a minute:\n${url}`,
      "Thanks for keeping everyone up and running!\n\n— Bibi",
    ].join("\n\n");
    await sendAuthMail({
      ...{ kind: "billing.reminder", to: admin.email, text },
      subject: `Your team is waiting to get back into Bibi`,
    }).catch((error: unknown) =>
      getLogger().warn({ event: "billing.reminderMailFailed", organizationId, err: error }),
    );
  }
}
